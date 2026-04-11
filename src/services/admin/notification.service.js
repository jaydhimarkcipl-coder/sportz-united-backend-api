const notificationRepo = require('../../repositories/admin/notification.repository');
const deviceRepo = require('../../repositories/user/device.repository');
const fcmUtil = require('../../utils/fcm.util');
const authRepo = require('../../repositories/user/auth.repository'); // Import if needed for arena_players or other queries
const { User, Player } = require('../../models');

class AdminNotificationService {
    async sendNotification(data, currentUserId) {
        const { targetType, playerId, title, message } = data;
        let tokens = [];

        try {
            if (targetType === 'all') {
                // Fetch all tokens from UserDevice
                const { UserDevice } = require('../../models');
                const allDevices = await UserDevice.findAll();
                tokens = allDevices.map(d => d.FCMToken);
            } else if (targetType === 'specific' && playerId) {
                tokens = await deviceRepo.getTokensByPlayerId(playerId);
            } else if (targetType === 'arena_players') {
                // Logic depends on how arena_players are defined. 
                // For now, if no specific arena id is in payload, we might not know.
                // Assuming payload might have arenaId for this type.
                if (data.arenaId) {
                    const players = await Player.findAll({ where: { ArenaId: data.arenaId } });
                    for (const p of players) {
                        const t = await deviceRepo.getTokensByPlayerId(p.PlayerId);
                        tokens.push(...t);
                    }
                }
            }

            // Send via Firebase if we have tokens
            if (tokens.length > 0) {
                await fcmUtil.sendToMultipleDevices(tokens, { title, body: message });
            }
        } catch (error) {
            console.error('Error sending push notifications:', error);
            // We continue to save to history even if push fails
        }

        // Keep local history
        return notificationRepo.sendNotification(currentUserId, data);
    }

    async getSentNotifications(currentUserId) {
        return notificationRepo.getNotificationsBySender(currentUserId);
    }
}

module.exports = new AdminNotificationService();
