const { Player } = require('../../models');

class AuthRepository {
    async findPlayerByEmail(email) {
        return await Player.findOne({ where: { Email: email } });
    }

    async findPlayerById(id) {
        return await Player.findByPk(id);
    }

    async updatePlayer(id, updateData) {
        const player = await this.findPlayerById(id);
        if (player) {
            return await player.update(updateData);
        }
        return null;
    }

    async createPlayer(playerData) {
        return await Player.create(playerData);
    }

    async findPlayerByPhone(phone) {
        return await Player.findOne({ where: { Phone: phone } });
    }
}

module.exports = new AuthRepository();
