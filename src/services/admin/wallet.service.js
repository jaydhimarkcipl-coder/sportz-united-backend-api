const adminWalletRepo = require('../../repositories/admin/wallet.repository');
const { sequelize } = require('../../config/database');

class AdminWalletService {
    async getPlayerWallet(playerId, ownedArenaIds) {
        // Find if this player has a wallet in any of the owned arenas
        return await adminWalletRepo.getWalletByPlayerAndArena(playerId, ownedArenaIds);
    }

    async topUpWallet(playerId, amount, reqUserContext, ownedArenaIds) {
        // Super admins MUST provide bodyArenaId. Owners use their first arena by default.
        const targetArenaId = reqUserContext.bodyArenaId || (ownedArenaIds ? ownedArenaIds[0] : null);
        
        if (!targetArenaId) {
            throw { statusCode: 400, message: 'Arena ID is required for top-up' };
        }

        if (ownedArenaIds && !ownedArenaIds.includes(Number(targetArenaId))) {
            throw { statusCode: 403, message: 'Invalid Arena ID for top-up' };
        }

        const t = await sequelize.transaction();
        try {
            const result = await adminWalletRepo.topUpWallet(playerId, amount, targetArenaId, reqUserContext.id, t);
            await t.commit();
            return { message: 'Wallet topped up successfully', data: result.wallet };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async getTransactionLogs(ownedArenaIds, adminUserId) {
        return await adminWalletRepo.getTransactions(ownedArenaIds, adminUserId);
    }
}

module.exports = new AdminWalletService();
