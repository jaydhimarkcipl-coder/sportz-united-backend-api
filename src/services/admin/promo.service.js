const promoRepo = require('../../repositories/admin/promo.repository');

class AdminPromoService {
    async createPromo(data, ownedArenaIds) {
        const targetArenaId = data.arenaId || ownedArenaIds[0];
        if (!ownedArenaIds.includes(targetArenaId)) {
            throw { statusCode: 403, message: 'Invalid Arena ID' };
        }
        return promoRepo.createPromo(targetArenaId, data);
    }

    async getPromos(ownedArenaIds) {
        return promoRepo.getPromos(ownedArenaIds);
    }

    async getPromoById(id, ownedArenaIds) {
        const promo = promoRepo.getPromoById(id, ownedArenaIds);
        if (!promo) {
            throw { statusCode: 404, message: 'Promo code not found' };
        }
        return promo;
    }
}

module.exports = new AdminPromoService();
