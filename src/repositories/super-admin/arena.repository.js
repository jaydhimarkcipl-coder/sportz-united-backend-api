const { Arena, User, Court, Sport, CourtSlot } = require('../../models');
const { getFullUrl } = require('../../utils/url.util');

class SuperArenaRepository {
    async createArena(data) {
        return await Arena.create(data);
    }

    // Helper to aggregate BasePrice and Sports
    _aggregateArenaData(arenaJson) {
        const courts = arenaJson.Courts || [];
        const associatedSports = arenaJson.Sports || [];
        
        // Sports Summary
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

        let minPrice = null;
        courts.forEach(c => {
            const prices = (c.CourtSlots || []).map(s => parseFloat(s.BasePrice)).filter(p => !isNaN(p));
            if (prices.length > 0) {
                const localMin = Math.min(...prices);
                if (minPrice === null || localMin < minPrice) minPrice = localMin;
            }
        });
        arenaJson.BasePrice = minPrice;

        // Clean up courts to show summary
        arenaJson.Courts = courts.map(c => ({
            CourtId: c.CourtId,
            CourtName: c.CourtName,
            SportId: c.SportId,
            Sport: c.Sport ? c.Sport.Name : null
        }));

        // Ensure absolute URLs
        if (arenaJson.LogoUrl) {
            arenaJson.LogoUrl = getFullUrl(arenaJson.LogoUrl);
        }

        return arenaJson;
    }

    async findAllArenas() {
        const arenas = await Arena.findAll({
            include: [
                { model: User, attributes: ['FullName'] },
                {
                    model: Sport,
                    attributes: ['SportId', 'Name', 'SportImageUrl'],
                    through: { attributes: [] }
                },
                {
                    model: Court,
                    attributes: ['CourtId', 'CourtName', 'SportId'],
                    where: { IsDelete: false },
                    required: false,
                    include: [
                        { model: Sport, attributes: ['Name'] },
                        { model: CourtSlot, attributes: ['BasePrice'], required: false }
                    ]
                }
            ]
        });

        return arenas.map(arena => this._aggregateArenaData(arena.toJSON()));
    }

    async findArenaById(id) {
        const arena = await Arena.findByPk(id, {
            include: [
                { model: User, attributes: ['FullName'] },
                {
                    model: Sport,
                    attributes: ['SportId', 'Name', 'SportImageUrl'],
                    through: { attributes: [] }
                },
                {
                    model: Court,
                    attributes: ['CourtId', 'CourtName', 'SportId'],
                    where: { IsDelete: false },
                    required: false,
                    include: [
                        { model: Sport, attributes: ['Name'] },
                        { model: CourtSlot, attributes: ['BasePrice'], required: false }
                    ]
                }
            ]
        });
        if (!arena) return null;
        return this._aggregateArenaData(arena.toJSON());
    }

    async findArenaInstanceById(id) {
        return await Arena.findByPk(id);
    }

    async updateArena(id, data) {
        const arena = await Arena.findByPk(id);
        if (arena) {
            return await arena.update(data);
        }
        return null;
    }

    async deleteArena(id) {
        // Soft delete assuming IsDelete field exists, or hard delete
        const arena = await Arena.findByPk(id);
        if (arena) {
            return await arena.update({ IsDelete: true, IsActive: false });
        }
        return null;
    }
}

module.exports = new SuperArenaRepository();
