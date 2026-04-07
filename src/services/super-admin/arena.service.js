const superArenaRepo = require('../../repositories/super-admin/arena.repository');
const { User } = require('../../models');

class SuperArenaService {
    async createArena(data) {
        const { sportIds, ...arenaData } = data;
        const arena = await superArenaRepo.createArena({
            ...arenaData,
            IsActive: true,
            IsDelete: false,
            IsApproved: false, // Explicitly set to false for approval flow
            ApprovalStatus: 'Pending'
        });

        // Handle many-to-many sports
        if (sportIds && Array.isArray(sportIds)) {
            await arena.setSports(sportIds);
        }

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
        const { sportIds, ...arenaData } = data;

        // If owner is being changed, we need to link the new owner to this arena
        if (arenaData.OwnerUserId) {
            await User.update(
                { ArenaId: id },
                { where: { UserId: arenaData.OwnerUserId } }
            );
        }

        const arenaInstance = await superArenaRepo.findArenaInstanceById(id);
        if (!arenaInstance) {
            throw { statusCode: 404, message: 'Arena not found' };
        }

        await arenaInstance.update(arenaData);

        // Handle many-to-many sports
        if (sportIds && Array.isArray(sportIds)) {
            await arenaInstance.setSports(sportIds);
        }

        return arenaInstance;
    }

    async reviewArena(id, isApproved, approvalStatus) {
        const arenaInstance = await superArenaRepo.findArenaInstanceById(id);
        if (!arenaInstance) {
            throw { statusCode: 404, message: 'Arena not found' };
        }

        await arenaInstance.update({
            IsApproved: isApproved,
            ApprovalStatus: approvalStatus
        });

        return arenaInstance;
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
