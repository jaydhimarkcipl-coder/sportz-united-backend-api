const adminPricingService = require('../../services/admin/pricing.service');

class AdminPricingController {
    async setPricing(req, res, next) {
        try {
            const result = await adminPricingService.setPricing(req.body, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async getPricing(req, res, next) {
        try {
            const courtId = req.query.courtId;
            if (!courtId) throw { statusCode: 400, message: 'courtId is required' };
            const result = await adminPricingService.getPricing(courtId, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminPricingController();
