const bookingService = require('../../services/user/booking.service');

class BookingController {
    async createBooking(req, res, next) {
        try {
            const { courtId, slotId, bookingDate, paymentMethod } = req.body;
            // Extract playerId from the verified JWT token
            const playerId = req.user.id;

            const booking = await bookingService.createBooking(playerId, courtId, slotId, bookingDate, paymentMethod);
            
            res.status(201).json({ success: true, message: 'Booking completed successfully', data: booking });
        } catch (error) {
            next(error);
        }
    }

    async getPlayerBookings(req, res, next) {
        try {
            const playerId = req.params.playerId || req.user.id;
            const bookings = await bookingService.getPlayerBookings(playerId);
            res.status(200).json({ success: true, data: bookings });
        } catch (error) {
            next(error);
        }
    }

    async cancelBooking(req, res, next) {
        try {
            await bookingService.cancelBooking(req.params.id);
            res.status(200).json({ success: true, message: 'Booking cancelled' });
        } catch (error) {
            next(error);
        }
    }

    async modifyBooking(req, res, next) {
        try {
            const result = await bookingService.modifyBooking(req.params.id, req.body);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BookingController();
