const { Court, Sport, Arena } = require('../../models');

class AdminCourtRepository {
    async createCourt(data) {
        return await Court.create(data);
    }

    async findCourts(arenaIds) {
        const where = arenaIds ? { ArenaId: arenaIds } : {};
        return await Court.findAll({ 
            where,
            include: [
                { model: Sport, attributes: ['Name'] },
                { model: Arena, attributes: ['Name', 'City'] }
            ]
        });
    }

    async findCourtById(id) {
        return await Court.findOne({
            where: { CourtId: id },
            include: [
                { model: Sport, attributes: ['Name'] },
                { model: Arena, attributes: ['Name', 'City'] }
            ]
        });
    }

    async updateCourt(id, data) {
        return await Court.update(data, { where: { CourtId: id } });
    }

    async deleteCourt(id) {
        return await Court.update({ IsDelete: true, IsActive: false }, { where: { CourtId: id } });
    }
}

module.exports = new AdminCourtRepository();
