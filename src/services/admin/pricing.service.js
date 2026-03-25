const adminPricingRepo = require('../../repositories/admin/pricing.repository');
const adminCourtRepo = require('../../repositories/admin/court.repository');

class AdminPricingService {
    async setPricing(params, ownedArenaIds) {
        const { courtId, dayName, startTime, endTime, isWeekend, basePrice, finalPrice } = params;

        // Verify Court ownership
        const court = await adminCourtRepo.findCourtById(courtId);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        const filters = {};
        if (dayName) filters.DayName = dayName;
        // simplistic time filtering via string matching or exact match.
        // real systems might use range queries natively.
        if (startTime && endTime) {
            filters.StartTime = startTime;
            // endTime logic normally handled by SlotDuration bounds
        }
        if (isWeekend) {
            // Apply to Saturday and Sunday
            filters.DayName = ['Saturday', 'Sunday'];
        }

        const result = await adminPricingRepo.updateSlotPrices(courtId, filters, { BasePrice: basePrice, FinalPrice: finalPrice });
        return { message: 'Pricing updated successfully', slotsAffected: result[0] };
    }

    async getPricing(courtId, ownedArenaIds) {
        const court = await adminCourtRepo.findCourtById(courtId);
        if (!court || (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId))) {
            throw { statusCode: 404, message: 'Court not found or access denied' };
        }

        return await adminPricingRepo.getCourtSlots(courtId);
    }
}

module.exports = new AdminPricingService();
