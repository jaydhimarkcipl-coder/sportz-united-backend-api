const promoRepo = require('../../repositories/admin/promo.repository');

class AdminPromoService {
    async createPromo(data, ownedArenaIds) {
        if (!data.arenaId && (!ownedArenaIds || ownedArenaIds.length === 0)) {
            throw { statusCode: 400, message: 'arenaId is required' };
        }
        const targetArenaId = data.arenaId || ownedArenaIds[0];
        if (ownedArenaIds && !ownedArenaIds.includes(targetArenaId)) {
            throw { statusCode: 403, message: 'Invalid Arena ID' };
        }
        return promoRepo.createPromo(targetArenaId, data);
    }

    async getPromos(ownedArenaIds) {
        return promoRepo.getPromos(ownedArenaIds);
    }

    async getPromoById(id, ownedArenaIds) {
        const promo = await promoRepo.getPromoById(id, ownedArenaIds);
        if (!promo) {
            throw { statusCode: 404, message: 'Promo code not found' };
        }
        return promo;
    }
}

module.exports = new AdminPromoService();
