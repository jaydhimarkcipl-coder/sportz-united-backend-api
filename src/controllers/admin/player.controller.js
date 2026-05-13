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

    async getAllUsers(req, res, next) {
        try {
            const { search } = req.query;
            const result = await adminPlayerService.getAllPlayers(search);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async checkPlayerByPhone(req, res, next) {
        try {
            const { phone } = req.params;
            const player = await adminPlayerService.getPlayerByPhone(phone);
            
            if (!player) {
                return res.status(200).json({ 
                    success: true, 
                    exists: false, 
                    message: 'Player not found' 
                });
            }

            res.status(200).json({ 
                success: true, 
                exists: true, 
                data: {
                    PlayerId: player.PlayerId,
                    FullName: player.FullName,
                    Email: player.Email,
                    Phone: player.Phone,
                    ProfilePhotoUrl: player.ProfilePhotoUrl
                } 
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminPlayerController();
