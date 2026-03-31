const { Arena, Amenity, ArenaAmenity } = require('../../models');
const { Op } = require('sequelize');
const { getFullUrl } = require('../../utils/url.util');
const { formatTimeToHHMMSS } = require('../../utils/time.util');

class ArenaRepository {
    async findAllActiveArenas() {
        const { Court, Sport, CourtSlot, Amenity } = require('../../models');
        const arenas = await Arena.findAll({
            where: { IsActive: true, IsDelete: false },
            include: [
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
                        { model: CourtSlot, attributes: ['SlotId', 'StartTime', 'EndTime', 'BasePrice', 'DayName'], required: false }
                    ]
                }
            ]
        });

        return arenas.map(arena => this._formatArena(arena));
    }

    async findArenaById(arenaId) {
        const { Court, Sport, CourtSlot, Amenity } = require('../../models');
        const arena = await Arena.findOne({
            where: { ArenaId: arenaId, IsActive: true, IsDelete: false },
            include: [
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
                        { model: CourtSlot, attributes: ['SlotId', 'StartTime', 'EndTime', 'BasePrice', 'DayName'], required: false }
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
        const { Court, Sport, CourtSlot, ArenaAmenity, sequelize } = require('../../models');

        const where = { IsActive: true, IsDelete: false };
        if (city) where.City = city;

        // 1. Rating Filter
        if (minRating) {
            where.AverageRating = { [Op.gte]: parseFloat(minRating) };
        }

        // 2. Distance Calculation & Filter
        const attributes = { include: [] };
        if (lat && lng) {
            const distanceLiteral = sequelize.literal(`
                (6371 * acos(cos(radians(${parseFloat(lat)})) * cos(radians(Latitude)) * cos(radians(Longitude) - radians(${parseFloat(lng)})) + sin(radians(${parseFloat(lat)})) * sin(radians(Latitude))))
            `);
            attributes.include.push([distanceLiteral, 'Distance']);

            // Note: Sequelize doesn't allow using aliases in WHERE for some dialects, 
            // but we can use having or filter in JS. For MSSQL/Sequelize, we might need a literal in where too.
            if (maxDistance) {
                where[Op.and] = sequelize.where(distanceLiteral, { [Op.lte]: parseFloat(maxDistance) });
            }
        }

        const include = [
            {
                model: Court,
                attributes: ['CourtId', 'SportId', 'CourtName'],
                where: { IsActive: true, IsDelete: false },
                required: false,
                include: [
                    { model: Sport, attributes: ['Name'] },
                    {
                        model: CourtSlot,
                        attributes: ['SlotId', 'StartTime', 'EndTime', 'BasePrice', 'DayName'],
                        required: false,
                        where: {}
                    }
                ]
            },
            {
                model: ArenaAmenity,
                include: [{ model: Amenity }]
            }
        ];

        // 3. Sport Filter
        if (sportId) {
            include[0].where.SportId = sportId;
            include[0].required = true;
        }

        // 4. Date & Availability Filter
        if (date || availability) {
            const slotWhere = include[0].include[1].where;
            include[0].required = true; // Must have courts
            include[0].include[1].required = true; // Must have matching slots

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

        // 5. Amenity Filter
        if (amenityIds && amenityIds.length > 0) {
            include.push({
                model: ArenaAmenity,
                where: { AmenityId: { [Op.in]: Array.isArray(amenityIds) ? amenityIds : [amenityIds] } },
                required: true
            });
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

    _formatArena(arena, isDetailed = false) {
        const arenaJson = arena.toJSON();
        const courts = arenaJson.Courts || [];

        // Aggregate Sports
        const sportsSet = new Set();
        courts.forEach(c => {
            if (c.Sport && c.Sport.Name) sportsSet.add(c.Sport.Name);
        });
        arenaJson.Sports = Array.from(sportsSet);

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
                        DayName: { [Op.like]: `%${dayName}%` }
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
