const arenaRepo = require('../../repositories/user/arena.repository');

class ArenaService {
    async getAllArenas() {
        return await arenaRepo.findAllActiveArenas();
    }

    async getArenaDetails(arenaId) {
        const arena = await arenaRepo.findArenaById(arenaId);
        if (!arena) {
            throw { statusCode: 404, message: 'Arena not found' };
        }
        return arena;
    }

    async getArenaCourts(arenaId) {
        return await arenaRepo.findCourtsByArenaId(arenaId);
    }

    async search(filters) {
        return await arenaRepo.searchArenas(filters);
    }

    async getArenaSlots(arenaId, date, filters = {}) {
        return await arenaRepo.findSlotsByArenaIdAndDate(arenaId, date, filters);
    }

    async getSportsByArenaId(arenaId) {
        return await arenaRepo.findSportsByArenaId(arenaId);
    }

    async getArenaReviews(arenaId) {
        return await arenaRepo.findReviewsByArenaId(arenaId);
    }

    async addArenaReview(arenaId, playerId, rating, reviewText) {
        if (!rating || rating < 1 || rating > 5) {
            throw { statusCode: 400, message: 'Rating must be between 1 and 5' };
        }
        return await arenaRepo.addReview(arenaId, playerId, rating, reviewText);
    }
}

module.exports = new ArenaService();
