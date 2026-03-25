const superSportRepo = require('../../repositories/super-admin/sport.repository');

class SuperSportService {
    async createSport(data) {
        return await superSportRepo.createSport({
            ...data,
            IsActive: true,
            IsDelete: false
        });
    }

    async getAllSports() {
        return await superSportRepo.findAllSports();
    }

    async getSportById(id) {
        const sport = await superSportRepo.findSportById(id);
        if (!sport) {
            throw { statusCode: 404, message: 'Sport not found' };
        }
        return sport;
    }

    async updateSport(id, data) {
        const updated = await superSportRepo.updateSport(id, data);
        if (!updated) {
            throw { statusCode: 404, message: 'Sport not found' };
        }
        return updated;
    }

    async deleteSport(id) {
        const deleted = await superSportRepo.deleteSport(id);
        if (!deleted) {
            throw { statusCode: 404, message: 'Sport not found' };
        }
        return { message: 'Sport deleted successfully' };
    }
}

module.exports = new SuperSportService();
