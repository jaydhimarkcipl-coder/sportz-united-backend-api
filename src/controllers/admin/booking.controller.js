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

    // Fetch booking by numeric ID or BookingCode (e.g., BKG-12345)
    async getBookingById(req, res, next) {
        try {
            const result = await adminBookingService.getBookingById(req.params.id, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    // Fetch booking by BookingCode (e.g., BKG-1782724700123)
    async getBookingByCode(req, res, next) {
        try {
            const bookingCode = req.params.bookingCode;
            const result = await adminBookingService.getBookingById(bookingCode, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            const bookingId = req.params.id;
            const result = await adminBookingService.updateBookingStatus(bookingId, status, req.ownedArenaIds);
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

    async createOffline(req, res, next) {
        try {
            const result = await adminBookingService.createOfflineBooking(req.body, req.ownedArenaIds);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getNormalBookings(req, res, next) {
        try {
            // Remove 'type: normal' filter so it returns all bookings just like the booking report
            const query = { ...req.query };
            const result = await adminBookingService.getAllBookings(req.ownedArenaIds, query);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getOfflineBookings(req, res, next) {
        try {
            const query = { ...req.query, type: 'offline' };
            const result = await adminBookingService.getAllBookings(req.ownedArenaIds, query);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async checkIn(req, res, next) {
        try {
            const { bookingId } = req.body;
            if (!bookingId) {
                return res.status(400).json({ success: false, message: 'bookingId is required' });
            }
            const result = await adminBookingService.checkInBooking(bookingId, req.ownedArenaIds);
            res.status(200).json({ success: true, message: 'successfully checked in', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getSlotDetails(req, res, next) {
        try {
            const result = await adminBookingService.getSlotDetails(req.body, req.ownedArenaIds);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminBookingController();
