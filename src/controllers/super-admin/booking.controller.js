const bookingRepo = require('../../repositories/user/booking.repository');

class SuperAdminBookingController {
    async clearAll(req, res, next) {
        try {
            await bookingRepo.clearAllBookings();
            res.json({ success: true, message: 'All bookings cleared successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SuperAdminBookingController();
