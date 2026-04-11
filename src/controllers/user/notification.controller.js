const deviceRepo = require('../../repositories/user/device.repository');

class NotificationController {
    async registerToken(req, res, next) {
        try {
            const { fcmToken, deviceType } = req.body;
            
            // Depending on who is logged in (Player vs Admin User)
            const userId = req.user.type === 'Admin' ? req.user.id : null;
            const playerId = req.user.type === 'Player' ? req.user.id : null;

            await deviceRepo.registerToken({
                userId,
                playerId,
                fcmToken,
                deviceType
            });

            res.status(200).json({ success: true, message: 'Device token registered' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
