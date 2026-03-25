const courtRepo = require('../../repositories/user/court.repository');

class CourtService {
    async getCourtsByArena(arenaId) {
        return await courtRepo.findCourtsByArenaId(arenaId);
    }

    async getCourtSlots(courtId, date) {
        if (!date) {
            throw { statusCode: 400, message: 'Date is required to fetch slots' };
        }
        return await courtRepo.findSlotsByCourtIdAndDate(courtId, date);
    }
}

module.exports = new CourtService();
