const adminCourtService = require('../../services/admin/court.service');

class AdminCourtController {
    async create(req, res, next) {
        try {
            const result = await adminCourtService.createCourt(req.body, req.ownedArenaIds);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const result = await adminCourtService.getCourts(req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const result = await adminCourtService.getCourtById(req.params.id, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const result = await adminCourtService.updateCourt(req.params.id, req.body, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            const result = await adminCourtService.deleteCourt(req.params.id, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminCourtController();
