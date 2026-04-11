const { PlayerRefreshToken } = require('../../models');
const { Op } = require('sequelize');

class PlayerRefreshTokenRepository {
    async createToken(playerId, token, expiresAt) {
        return await PlayerRefreshToken.create({
            PlayerId: playerId,
            Token: token,
            ExpiresAt: expiresAt
        });
    }

    async findToken(token) {
        const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
        return await PlayerRefreshToken.findOne({
            where: {
                Token: token,
                IsRevoked: false,
                ExpiresAt: { [Op.gt]: nowStr }
            }
        });
    }

    async revokeToken(token) {
        return await PlayerRefreshToken.update(
            { IsRevoked: true },
            { where: { Token: token } }
        );
    }

    async revokeAllPlayerTokens(playerId) {
        return await PlayerRefreshToken.update(
            { IsRevoked: true },
            { where: { PlayerId: playerId } }
        );
    }
}

module.exports = new PlayerRefreshTokenRepository();
