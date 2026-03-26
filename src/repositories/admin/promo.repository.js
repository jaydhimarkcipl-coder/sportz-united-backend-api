const { PromoCode } = require('../../models');
const { Op } = require('sequelize');

class PromoRepository {
    async createPromo(arenaId, promoData) {
        console.log('--- Creating Promo ---');
        console.log('Raw data:', promoData);
        // Ensure dates are either a valid YYYY-MM-DD string or null
        const parseDate = (d) => {
            if (!d) return null;
            const date = new Date(d);
            if (isNaN(date.getTime())) return null;
            return date.toISOString().split('T')[0];
        };

        const validFrom = parseDate(promoData.validFrom);
        const validUntil = parseDate(promoData.validUntil);
        console.log('Parsed dates:', { validFrom, validUntil });

        return await PromoCode.create({
            ArenaId: arenaId,
            Code: (promoData.code || '').toUpperCase(),
            DiscountType: promoData.discountType || 'flat',
            DiscountValue: promoData.discountValue,
            MinBookingAmount: promoData.minBookingAmount || 0,
            MaxDiscount: promoData.maxDiscount || null,
            UsageLimit: promoData.usageLimit || null,
            ValidFrom: validFrom,
            ValidUntil: validUntil,
            IsActive: true
        });
    }

    async getPromos(arenaIds) {
        const where = { IsActive: true };
        // null arenaIds = super_admin — return all
        if (arenaIds) {
            where.ArenaId = { [Op.in]: arenaIds };
        }
        return await PromoCode.findAll({ where, order: [['CreatedDate', 'DESC']] });
    }

    async getPromoById(id, arenaIds) {
        const where = { PromoId: id };
        if (arenaIds) {
            where.ArenaId = { [Op.in]: arenaIds };
        }
        return await PromoCode.findOne({ where });
    }

    async getPromosByArena(arenaIds) {
        return this.getPromos(arenaIds);
    }

    async validatePromoCode(code, arenaId, bookingAmount) {
        const { sequelize } = require('../../models');
        const promo = await PromoCode.findOne({
            where: {
                Code: code.toUpperCase(),
                ArenaId: arenaId,
                IsActive: true,
                [Op.and]: [
                    sequelize.literal('(ValidUntil IS NULL OR ValidUntil >= GETDATE())'),
                    sequelize.literal('(ValidFrom IS NULL OR ValidFrom <= GETDATE())')
                ],
                MinBookingAmount: { [Op.lte]: bookingAmount }
            }
        });

        if (!promo) return null;

        // Check usage limit
        if (promo.UsageLimit !== null && promo.UsedCount >= promo.UsageLimit) {
            return null; // Exhausted
        }

        return promo;
    }

    async incrementUsage(promoId) {
        await PromoCode.increment('UsedCount', { where: { PromoId: promoId } });
    }

    async updatePromo(id, arenaIds, data) {
        const where = { PromoId: id };
        if (arenaIds) where.ArenaId = { [Op.in]: arenaIds };
        await PromoCode.update(data, { where });
        return this.getPromoById(id, arenaIds);
    }

    async deletePromo(id, arenaIds) {
        const where = { PromoId: id };
        if (arenaIds) where.ArenaId = { [Op.in]: arenaIds };
        return await PromoCode.update({ IsActive: false }, { where });
    }
}

module.exports = new PromoRepository();
