const adminPlayerRepo = require('../../repositories/admin/player.repository');

class AdminPlayerService {
    async getPlayersByArena(ownedArenaIds) {
        if (!ownedArenaIds || ownedArenaIds.length === 0) {
            return [];
        }
        return await adminPlayerRepo.findPlayersByArena(ownedArenaIds);
    }

    async getAllPlayers(search) {
        return await adminPlayerRepo.findAllPlayers(search);
    }

    async getPlayerByPhone(phone) {
        const authRepo = require('../../repositories/user/auth.repository');
        return await authRepo.findPlayerByPhone(phone);
    }
}

module.exports = new AdminPlayerService();
