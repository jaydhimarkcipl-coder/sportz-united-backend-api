const adminPlayerService = require('../../services/admin/player.service');

class AdminPlayerController {
    async getPlayers(req, res, next) {
        try {
            // req.ownedArenaIds is injected by requireArenaOwnership middleware
            const result = await adminPlayerService.getPlayersByArena(req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminPlayerController();
