const superArenaRepo = require('../../repositories/super-admin/arena.repository');
const { User } = require('../../models');

class SuperArenaService {
    async createArena(data) {
        const arena = await superArenaRepo.createArena({
            ...data,
            IsActive: true,
            IsDelete: false
        });

        // Link the owner to this arena if they don't have one yet
        if (arena.OwnerUserId) {
            await User.update(
                { ArenaId: arena.ArenaId },
                { where: { UserId: arena.OwnerUserId, ArenaId: null } }
            );
        }

        return arena;
    }

    async getAllArenas() {
        return await superArenaRepo.findAllArenas();
    }

    async getArenaById(id) {
        const arena = await superArenaRepo.findArenaById(id);
        if (!arena) {
            throw { statusCode: 404, message: 'Arena not found' };
        }
        return arena;
    }

    async updateArena(id, data) {
        // If owner is being changed, we need to link the new owner to this arena
        if (data.OwnerUserId) {
            await User.update(
                { ArenaId: id },
                { where: { UserId: data.OwnerUserId } }
            );
        }

        const updated = await superArenaRepo.updateArena(id, data);
        if (!updated) {
            throw { statusCode: 404, message: 'Arena not found' };
        }
        return updated;
    }

    async deleteArena(id) {
        const deleted = await superArenaRepo.deleteArena(id);
        if (!deleted) {
            throw { statusCode: 404, message: 'Arena not found' };
        }
        return { message: 'Arena deleted successfully' };
    }
}

module.exports = new SuperArenaService();
