const { Arena, Amenity, ArenaAmenity } = require('../../models');
const { Op } = require('sequelize');

class ArenaRepository {
    async findAllActiveArenas() {
        return await Arena.findAll({
            where: { IsActive: true, IsDelete: false }
        });
    }

    async findArenaById(arenaId) {
        const { Court, Sport, CourtSlot } = require('../../models');
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
                        { model: CourtSlot, attributes: ['BasePrice'], required: false }
                    ]
                }
            ]
        });

        if (!arena) return null;

        const arenaJson = arena.toJSON();
        const courts = arenaJson.Courts || [];

        // Aggregate Sports
        const sportsSet = new Set();
        courts.forEach(c => {
            if (c.Sport && c.Sport.Name) sportsSet.add(c.Sport.Name);
        });
        arenaJson.Sports = Array.from(sportsSet);

        // Aggregate BasePrice (min)
        let minPrice = null;
        courts.forEach(c => {
            const prices = (c.CourtSlots || []).map(s => parseFloat(s.BasePrice)).filter(p => !isNaN(p));
            if (prices.length > 0) {
                const localMin = Math.min(...prices);
                if (minPrice === null || localMin < minPrice) minPrice = localMin;
            }
        });
        arenaJson.BasePrice = minPrice;

        // Keep courts list but clean up nested slots
        arenaJson.Courts = courts.map(c => ({
            CourtId: c.CourtId,
            CourtName: c.CourtName,
            Sport: c.Sport ? c.Sport.Name : null
        }));

        return arenaJson;
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
            attributes.include.push([distanceLiteral, 'distance']);
            
            // Note: Sequelize doesn't allow using aliases in WHERE for some dialects, 
            // but we can use having or filter in JS. For MSSQL/Sequelize, we might need a literal in where too.
            if (maxDistance) {
                where[Op.and] = sequelize.where(distanceLiteral, { [Op.lte]: parseFloat(maxDistance) });
            }
        }

        const include = [
            {
                model: Court,
                attributes: ['CourtId', 'SportId'],
                where: { IsActive: true, IsDelete: false },
                required: false,
                include: [
                    { model: Sport, attributes: ['Name'] },
                    { 
                        model: CourtSlot, 
                        attributes: ['BasePrice', 'StartTime', 'DayName'], 
                        required: false,
                        where: {} 
                    }
                ]
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

        let arenas = await Arena.findAll({ where, include, attributes, order: lat && lng ? [[sequelize.literal('distance'), 'ASC']] : [] });

        // 6. Post-process & Price Range Filter
        let results = arenas.map(arena => {
            const arenaJson = arena.toJSON();
            const courts = arenaJson.Courts || [];
            
            const sportsSet = new Set();
            courts.forEach(c => {
                if (c.Sport && c.Sport.Name) sportsSet.add(c.Sport.Name);
            });
            arenaJson.Sports = Array.from(sportsSet);

            let minPrice = null;
            courts.forEach(c => {
                const prices = (c.CourtSlots || []).map(s => parseFloat(s.BasePrice)).filter(p => !isNaN(p));
                if (prices.length > 0) {
                    const localMin = Math.min(...prices);
                    if (minPrice === null || localMin < minPrice) minPrice = localMin;
                }
            });
            arenaJson.BasePrice = minPrice;
            
            if (arenaJson.distance) {
                arenaJson.distance = parseFloat(parseFloat(arenaJson.distance).toFixed(2));
            }

            delete arenaJson.Courts;
            delete arenaJson.ArenaAmenities;
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
}

module.exports = new ArenaRepository();
