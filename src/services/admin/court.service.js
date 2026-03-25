const adminCourtRepo = require('../../repositories/admin/court.repository');

class AdminCourtService {
    async createCourt(data, ownedArenaIds) {
        // Validate that the ArenaId they want to add a court to belongs to them
        if (ownedArenaIds && !ownedArenaIds.includes(data.arenaId || data.ArenaId)) {
            throw { statusCode: 403, message: 'You do not own this Arena' };
        }

        return await adminCourtRepo.createCourt({
            ...data,
            IsActive: true,
            IsDelete: false
        });
    }

    async getCourts(ownedArenaIds) {
        return await adminCourtRepo.findCourts(ownedArenaIds);
    }

    async getCourtById(id, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(id);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }
        return court;
    }

    async updateCourt(id, data, ownedArenaIds) {
        // Ensure court exists and belongs to owner
        const court = await adminCourtRepo.findCourtById(id);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        await adminCourtRepo.updateCourt(id, data);
        return { message: 'Court updated successfully' };
    }

    async deleteCourt(id, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(id);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        await adminCourtRepo.deleteCourt(id);
        return { message: 'Court deleted successfully' };
    }
}

module.exports = new AdminCourtService();
