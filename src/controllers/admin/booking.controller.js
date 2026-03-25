const adminBookingService = require('../../services/admin/booking.service');

class AdminBookingController {
    async getBookings(req, res, next) {
        try {
            // req.ownedArenaIds injected by requireArenaOwnership middleware if arena_owner
            const result = await adminBookingService.getAllBookings(req.ownedArenaIds, req.query);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getBookingById(req, res, next) {
        try {
            const result = await adminBookingService.getBookingById(req.params.id, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            const result = await adminBookingService.updateBookingStatus(req.params.id, status, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async cancelBooking(req, res, next) {
        try {
            const result = await adminBookingService.cancelBookingWithRefund(req.params.id, req.ownedArenaIds);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    async createManual(req, res, next) {
        try {
            const result = await adminBookingService.createManualBooking(req.body, req.ownedArenaIds);
            res.status(201).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminBookingController();
