const adminWalletService = require('../../services/admin/wallet.service');

class AdminWalletController {
    async getWallet(req, res, next) {
        try {
            const result = await adminWalletService.getPlayerWallet(req.params.playerId, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async topup(req, res, next) {
        try {
            const { playerId, amount, arenaId } = req.body;
            // Inject arenaId if needed into context
            const userContext = { id: req.user.id, bodyArenaId: arenaId };
            
            const result = await adminWalletService.topUpWallet(playerId, amount, userContext, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const result = await adminWalletService.getTransactionLogs(req.ownedArenaIds, req.user.id);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminWalletController();
