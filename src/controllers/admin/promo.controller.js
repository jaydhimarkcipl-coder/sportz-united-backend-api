const adminPromoService = require('../../services/admin/promo.service');

class AdminPromoController {
    async create(req, res, next) {
        try {
            const result = await adminPromoService.createPromo(req.body, req.ownedArenaIds);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await adminPromoService.getPromos(req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const result = await adminPromoService.getPromoById(req.params.id, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminPromoController();
