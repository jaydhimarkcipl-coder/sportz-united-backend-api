const RefreshToken = require('../../models/RefreshToken');
const { Op } = require('sequelize');

class AdminRefreshTokenRepository {
    async createToken(userId, token, expiresAt) {
        return await RefreshToken.create({
            UserId: userId,
            Token: token,
            ExpiresAt: expiresAt
            // Let the DB handle CreatedDate and IsRevoked via defaults
        });
    }

    async findToken(token) {
        // Use a string comparison for date to be safe
        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
        return await RefreshToken.findOne({
            where: {
                Token: token,
                IsRevoked: false,
                ExpiresAt: { [Op.gt]: nowStr }
            }
        });
    }

    async revokeToken(token) {
        return await RefreshToken.update(
            { IsRevoked: true },
            { where: { Token: token } }
        );
    }

    async revokeAllUserTokens(userId) {
        return await RefreshToken.update(
            { IsRevoked: true },
            { where: { UserId: userId } }
        );
    }
}

module.exports = new AdminRefreshTokenRepository();
