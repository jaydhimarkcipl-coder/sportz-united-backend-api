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
}

module.exports = new ArenaService();
