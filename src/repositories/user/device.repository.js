const { UserDevice } = require('../../models');

class UserDeviceRepository {
    async registerToken({ userId, playerId, fcmToken, deviceType }) {
        // Upsert logic: if token exists, update owner
        const existingToken = await UserDevice.findOne({ where: { FCMToken: fcmToken } });
        
        if (existingToken) {
            return await existingToken.update({
                UserId: userId || existingToken.UserId,
                PlayerId: playerId || existingToken.PlayerId,
                DeviceType: deviceType || existingToken.DeviceType
            });
        }

        return await UserDevice.create({
            UserId: userId,
            PlayerId: playerId,
            FCMToken: fcmToken,
            DeviceType: deviceType
        });
    }

    async getTokensByUserId(userId) {
        const devices = await UserDevice.findAll({ where: { UserId: userId } });
        return devices.map(d => d.FCMToken);
    }

    async getTokensByPlayerId(playerId) {
        const devices = await UserDevice.findAll({ where: { PlayerId: playerId } });
        return devices.map(d => d.FCMToken);
    }

    async deleteToken(fcmToken) {
        return await UserDevice.destroy({ where: { FCMToken: fcmToken } });
    }
}

module.exports = new UserDeviceRepository();
