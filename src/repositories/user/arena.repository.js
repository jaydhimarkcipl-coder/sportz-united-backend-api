const { Arena, Amenity, ArenaAmenity, Sport } = require('../../models');
const { Op } = require('sequelize');
const { getFullUrl } = require('../../utils/url.util');
const { formatTimeToHHMMSS } = require('../../utils/time.util');

class ArenaRepository {
    async findAllActiveArenas() {
        const { Court, CourtSlot, Amenity } = require('../../models');
        const arenas = await Arena.findAll({
            where: { IsActive: true, IsDelete: false, IsApproved: true },
            include: [
                {
                    model: Sport,
                    attributes: ['SportId', 'Name', 'SportImageUrl'],
                    through: { attributes: [] } // Hide junction table attributes
                },
                {
                    model: ArenaAmenity,
                    include: [{ model: Amenity }]
                },
                {
                    model: Court,
                    attributes: ['CourtId', 'CourtName', 'SportId'],
                    where: { IsActive: true, IsDelete: false },
                    required: false,
                    include: [
                        { model: Sport, attributes: ['Name'] },
                        {
                            model: CourtSlot,
                            attributes: ['SlotId', 'StartTime', 'EndTime', 'BasePrice', 'DayName', 'IsActive'],
                            required: false,
                            where: { IsActive: true } // Only show active slots to users
                        }
                    ]
                }
            ]
        });

        return arenas.map(arena => this._formatArena(arena));
    }

    async findArenaById(arenaId) {
        const { Court, CourtSlot, Amenity } = require('../../models');
        const arena = await Arena.findOne({
            where: { ArenaId: arenaId, IsActive: true, IsDelete: false, IsApproved: true },
            include: [
                {
                    model: Sport,
                    attributes: ['SportId', 'Name', 'SportImageUrl'],
                    through: { attributes: [] }
                },
                {
                    model: ArenaAmenity,
                    include: [{ model: Amenity }]
                },
                {
                    model: Court,
                    attributes: ['CourtId', 'CourtName', 'SportId'],
                    where: { IsActive: true, IsDelete: false },
                    required: false,
                    include: [
                        { model: Sport, attributes: ['Name'] },
                        {
                            model: CourtSlot,
                            attributes: ['SlotId', 'StartTime', 'EndTime', 'BasePrice', 'DayName', 'IsActive'],
                            required: false,
                            where: { IsActive: true } // Only show active slots to users
                        }
                    ]
                }
            ]
        });

        if (!arena) return null;
        return this._formatArena(arena, true); // true indicates detailed view
    }

    async findCourtsByArenaId(arenaId) {
        const { Court, Sport } = require('../../models');
        return await Court.findAll({
            where: { ArenaId: arenaId, IsActive: true, IsDelete: false },
            include: [{ model: Sport }]
        });
    }

    async searchArenas(params) {
        const { lat, lng, sportId, city, minRating, priceRange, date, availability, maxDistance, amenityIds } = params;
        const { Court, Sport, CourtSlot, ArenaAmenity, sequelize, Amenity } = require('../../models');

        const where = { IsActive: true, IsDelete: false, IsApproved: true };
        if (city) where.City = city;

        // 1. Rating Filter
        if (minRating) {
            where.AverageRating = { [Op.gte]: parseFloat(minRating) };
        }

        // 2. Distance Calculation & Filter
        const attributes = { include: [] };
        if (lat && lng) {
            const distanceLiteral = sequelize.literal(`
                (6371 * acos(
                    CASE 
                        WHEN (cos(radians(${parseFloat(lat)})) * cos(radians(Latitude)) * cos(radians(Longitude) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(Latitude))) > 1 THEN 1
                        WHEN (cos(radians(${parseFloat(lat)})) * cos(radians(Latitude)) * cos(radians(Longitude) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(Latitude))) < -1 THEN -1
                        ELSE (cos(radians(${parseFloat(lat)})) * cos(radians(Latitude)) * cos(radians(Longitude) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(Latitude)))
                    END
                ))
            `);
            attributes.include.push([distanceLiteral, 'Distance']);

            if (maxDistance) {
                where[Op.and] = sequelize.where(distanceLiteral, { [Op.lte]: parseFloat(maxDistance) });
            }
        }

        const include = [
            {
                model: Sport,
                attributes: ['SportId', 'Name', 'SportImageUrl'],
                through: { attributes: [] },
                required: !!sportId,
                where: sportId ? { SportId: sportId } : {}
            },
            {
                model: Court,
                attributes: ['CourtId', 'SportId', 'CourtName'],
                where: { IsActive: true, IsDelete: false },
                required: false,
                include: [
                    { model: Sport, attributes: ['Name'] },
                    {
                        model: CourtSlot,
                        attributes: ['SlotId', 'StartTime', 'EndTime', 'BasePrice', 'DayName', 'IsActive'],
                        required: false,
                        where: { IsActive: true }
                    }
                ]
            },
            {
                model: ArenaAmenity,
                attributes: ['amenityId'],
                include: [{ model: Amenity, attributes: ['name', 'iconUrl'] }],
                required: false
            }
        ];

        // 3. Date & Availability Filter (requires Courts)
        if (date || availability) {
            const slotWhere = include[1].include[1].where;
            include[1].required = true;
            include[1].include[1].required = true;

            if (date) {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = days[new Date(date).getDay()];
                slotWhere.DayName = dayName;
            }

            if (availability) {
                if (availability === 'morning') {
                    slotWhere.StartTime = { [Op.between]: ['06:00', '11:59'] };
                } else if (availability === 'afternoon') {
                    slotWhere.StartTime = { [Op.between]: ['12:00', '16:59'] };
                } else if (availability === 'evening') {
                    slotWhere.StartTime = { [Op.between]: ['17:00', '23:59'] };
                }
            }
        }

        // 4. Amenity Filter (AND Logic - Contains All)
        if (amenityIds && amenityIds.length > 0) {
            const ids = Array.isArray(amenityIds) ? amenityIds : amenityIds.split(',').map(id => id.trim());

            // We find arenas that have ALL selected amenities using a subquery
            where.ArenaId = {
                [Op.in]: sequelize.literal(`(
                    SELECT arenaId 
                    FROM tblArenaAmenities 
                    WHERE amenityId IN (${ids.join(',')}) 
                    AND isActive = 1
                    GROUP BY arenaId 
                    HAVING COUNT(DISTINCT amenityId) = ${ids.length}
                )`)
            };
        }

        let arenas = await Arena.findAll({ where, include, attributes, order: lat && lng ? [[sequelize.literal('Distance'), 'ASC']] : [] });

        // 6. Post-process & Price Range Filter
        let results = arenas.map(arena => {
            const arenaJson = this._formatArena(arena);
            if (arenaJson.Distance) {
                arenaJson.Distance = parseFloat(parseFloat(arenaJson.Distance).toFixed(2));
            }
            return arenaJson;
        });

        // Apply Price Range filter if requested
        if (priceRange) {
            results = results.filter(a => {
                if (!a.BasePrice) return false;
                if (priceRange === 'under1000') return a.BasePrice < 1000;
                if (priceRange === '1000to1500') return a.BasePrice >= 1000 && a.BasePrice <= 1500;
                if (priceRange === 'above1500') return a.BasePrice > 1500;
                return true;
            });
        }

        return results;
    }

    async findSportsByArenaId(arenaId) {
        const { Sport, ArenaSport } = require('../../models');
        return await Sport.findAll({
            include: [
                {
                    model: ArenaSport,
                    where: { arenaId: arenaId, isActive: true },
                    attributes: []
                }
            ]
        });
    }

    _formatArena(arena, isDetailed = false) {
        const arenaJson = arena.toJSON();
        const courts = arenaJson.Courts || [];

        // Primary source: Associated Sports from tblArenaSports
        const associatedSports = arenaJson.Sports || [];

        // Final Sports Summary
        const sportsSet = new Set();
        associatedSports.forEach(s => {
            if (s.Name) sportsSet.add(s.Name);
        });

        // Also include sports from courts
        courts.forEach(c => {
            if (c.Sport && c.Sport.Name) sportsSet.add(c.Sport.Name);
        });

        arenaJson.Sports = associatedSports.map(s => ({
            SportId: s.SportId,
            Name: s.Name,
            SportImageUrl: s.SportImageUrl ? getFullUrl(s.SportImageUrl) : null
        }));

        arenaJson.SportsSummary = Array.from(sportsSet);

        // Aggregate Amenities
        const amenities = [];
        if (arenaJson.ArenaAmenities) {
            arenaJson.ArenaAmenities.forEach(aa => {
                if (aa.isActive && aa.Amenity && aa.Amenity.isActive && !aa.Amenity.isDelete && aa.Amenity.name) {
                    amenities.push({
                        AmenityId: aa.Amenity.amenityId,
                        Name: aa.Amenity.name
                    });
                }
            });
        }
        arenaJson.Amenities = amenities;

        // Aggregate BasePrice and Slots
        let minPrice = null;
        const allSlots = [];
        courts.forEach(c => {
            const prices = (c.CourtSlots || []).map(s => parseFloat(s.BasePrice)).filter(p => !isNaN(p) && p > 0);
            if (prices.length > 0) {
                const localMin = Math.min(...prices);
                if (minPrice === null || localMin < minPrice) minPrice = localMin;
            }

            if (c.CourtSlots) {
                c.CourtSlots.forEach(s => {
                    allSlots.push({
                        ...s,
                        StartTime: formatTimeToHHMMSS(s.StartTime),
                        EndTime: formatTimeToHHMMSS(s.EndTime),
                        CourtId: c.CourtId,
                        CourtName: c.CourtName
                    });
                });
            }
        });
        arenaJson.BasePrice = minPrice || 0;
        arenaJson.Slots = allSlots;

        // Ensure absolute URLs
        if (arenaJson.LogoUrl) {
            arenaJson.LogoUrl = getFullUrl(arenaJson.LogoUrl);
        }

        // Map Courts with SportId
        arenaJson.Courts = courts.map(c => ({
            CourtId: c.CourtId,
            CourtName: c.CourtName,
            SportId: c.SportId,
            Sport: c.Sport ? c.Sport.Name : null
        }));

        delete arenaJson.ArenaAmenities;
        return arenaJson;
    }

    async findSlotsByArenaIdAndDate(arenaId, date, filters = {}) {
        const { sportId, courtId } = filters;
        const { Court, Sport, CourtSlot, Booking, BookingDetail } = require('../../models');

        const dateObj = new Date(date);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dateObj.getDay()];

        const courtWhere = { ArenaId: arenaId, IsActive: true, IsDelete: false };
        if (sportId) courtWhere.SportId = sportId;
        if (courtId) courtWhere.CourtId = courtId;

        // 1. Get all courts for the arena
        const courts = await Court.findAll({
            where: courtWhere,
            include: [
                { model: Sport, attributes: ['Name'] },
                {
                    model: CourtSlot,
                    where: {
                        DayName: { [Op.like]: `%${dayName}%` },
                        IsActive: true // Only show active slots
                    },
                    required: false
                }
            ]
        });

        // 2. Get all bookings for these courts on the given date
        const courtIds = courts.map(c => c.CourtId);
        const bookings = await Booking.findAll({
            where: {
                CourtId: { [Op.in]: courtIds },
                BookingDate: date,
                Status: 'Confirmed'
            },
            include: [{ model: BookingDetail, attributes: ['SlotId'] }]
        });

        // Create a map of booked slot IDs
        const bookedSlotIds = new Set();
        bookings.forEach(b => {
            if (b.BookingDetails) {
                b.BookingDetails.forEach(bd => bookedSlotIds.add(bd.SlotId));
            }
        });

        // 3. Format the result
        return courts.map(court => {
            const courtJson = court.toJSON();
            const slots = (courtJson.CourtSlots || []).map(slot => ({
                ...slot,
                StartTime: formatTimeToHHMMSS(slot.StartTime),
                EndTime: formatTimeToHHMMSS(slot.EndTime),
                Status: bookedSlotIds.has(slot.SlotId) ? 'Booked' : 'Available'
            }));

            return {
                CourtId: courtJson.CourtId,
                CourtName: courtJson.CourtName,
                SportName: courtJson.Sport ? courtJson.Sport.Name : null,
                Slots: slots
            };
        });
    }
}

module.exports = new ArenaRepository();
