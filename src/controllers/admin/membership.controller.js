const adminMemService = require('../../services/admin/membership.service');

class AdminMembershipController {
    async createPlan(req, res, next) {
        try {
            const result = await adminMemService.createPlan(req.body, req.ownedArenaIds);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getPlans(req, res, next) {
        try {
            const result = await adminMemService.getPlans(req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async assign(req, res, next) {
        try {
            const result = await adminMemService.assignPlanToUser(req.body, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminMembershipController();
