const adminPlayerRepo = require('../../repositories/admin/player.repository');

class AdminPlayerService {
    async getPlayersByArena(ownedArenaIds) {
        if (!ownedArenaIds || ownedArenaIds.length === 0) {
            return [];
        }
        return await adminPlayerRepo.findPlayersByArena(ownedArenaIds);
    }
}

module.exports = new AdminPlayerService();
