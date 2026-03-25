const { Sport } = require('../../models');

class SuperSportRepository {
    async createSport(data) {
        return await Sport.create(data);
    }

    async findAllSports() {
        return await Sport.findAll({
            where: { IsDelete: false }
        });
    }

    async findSportById(id) {
        return await Sport.findByPk(id);
    }

    async updateSport(id, data) {
        const sport = await Sport.findByPk(id);
        if (sport) {
            return await sport.update(data);
        }
        return null;
    }

    async deleteSport(id) {
        const sport = await Sport.findByPk(id);
        if (sport) {
            // Soft delete or hard delete based on preference, here soft delete
            return await sport.update({ IsDelete: true, IsActive: false });
        }
        return null;
    }
}

module.exports = new SuperSportRepository();
