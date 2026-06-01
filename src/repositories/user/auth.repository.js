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

    /** Match 10-digit, +91, or other stored formats (admin check vs offline booking). */
    async findPlayerByPhoneFlexible(phone) {
        const raw = String(phone ?? '').trim();
        if (!raw) return null;

        let player = await this.findPlayerByPhone(raw);
        if (player) return player;

        const digits = raw.replace(/\D/g, '');
        const local10 =
            digits.length >= 10 ? digits.slice(-10) : digits.length === 10 ? digits : null;

        if (!local10 || local10.length !== 10) return null;

        if (raw !== local10) {
            player = await this.findPlayerByPhone(local10);
            if (player) return player;
        }

        const e164 = `+91${local10}`;
        if (raw !== e164) {
            player = await this.findPlayerByPhone(e164);
            if (player) return player;
        }

        const alt91 = `91${local10}`;
        if (raw !== alt91) {
            player = await this.findPlayerByPhone(alt91);
            if (player) return player;
        }

        return null;
    }
}

module.exports = new AuthRepository();
