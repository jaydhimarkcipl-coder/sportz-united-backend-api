const adminReportService = require('../../services/admin/report.service');

class AdminReportController {
    async getRevenue(req, res, next) {
        try {
            const data = await adminReportService.getRevenue(req.user, req.ownedArenaIds);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getBookings(req, res, next) {
        try {
            const data = await adminReportService.getBookings(req.user, req.ownedArenaIds);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getOccupancy(req, res, next) {
        try {
            const data = await adminReportService.getOccupancy(req.user, req.ownedArenaIds);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getTransactionReport(req, res, next) {
        try {
            const data = await adminReportService.getTransactionReport(req.user, req.ownedArenaIds, req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getBookingReport(req, res, next) {
        try {
            const data = await adminReportService.getBookingReport(req.user, req.ownedArenaIds, req.query);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminReportController();
