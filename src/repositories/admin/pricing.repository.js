const { CourtSlot, Court } = require('../../models');

class AdminPricingRepository {
    async updateSlotPrices(courtId, filters, newPrices) {
        return await CourtSlot.update(
            { BasePrice: newPrices.BasePrice, FinalPrice: newPrices.FinalPrice },
            { 
                where: { 
                    CourtId: courtId,
                    ...filters
                }
            }
        );
    }

    async getCourtSlots(courtId) {
        return await CourtSlot.findAll({ where: { CourtId: courtId } });
    }
}

module.exports = new AdminPricingRepository();
