const { Arena, User, Court, Sport, CourtSlot } = require('../../models');

class SuperArenaRepository {
    async createArena(data) {
        return await Arena.create(data);
    }

    // Helper to aggregate BasePrice and Sports
    _aggregateArenaData(arenaJson) {
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

        // Clean up courts to show summary
        arenaJson.Courts = courts.map(c => ({
            CourtId: c.CourtId,
            CourtName: c.CourtName,
            Sport: c.Sport ? c.Sport.Name : null
        }));

        return arenaJson;
    }

    async findAllArenas() {
        const arenas = await Arena.findAll({
            include: [
                { model: User, attributes: ['FullName'] },
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
