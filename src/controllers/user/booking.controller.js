const bookingService = require('../../services/user/booking.service');
const { getFullUrl } = require('../../utils/url.util');

class BookingController {
    async createBooking(req, res, next) {
        try {
            const { courtId, slotId, slotIds, bookingDate, paymentMethod } = req.body;
            // Normalizing slot input into an array
            const finalSlotIds = Array.isArray(slotIds) ? slotIds : (slotId ? [slotId] : []);
            
            // Extract playerId from the verified JWT token
            const playerId = req.user.id;

            const booking = await bookingService.createBooking(playerId, courtId, finalSlotIds, bookingDate, paymentMethod);
            
            // Add QR code URL to the response if available
            // Note: booking might need to be re-fetched or we manually construct the URL
            const bookingJson = booking.toJSON ? booking.toJSON() : booking;
            const qrFilename = `qr-${bookingJson.BookingCode}.png`;
            bookingJson.qrCodeUrl = getFullUrl(`uploads/qrcodes/${qrFilename}`);
            
            res.status(201).json({ success: true, message: 'Booking completed successfully', data: bookingJson });
        } catch (error) {
            next(error);
        }
    }

    async getPlayerBookings(req, res, next) {
        try {
            const playerId = req.params.playerId || req.user.id;
            const bookings = await bookingService.getPlayerBookings(playerId);
            
            // Map over bookings to add full QR code URLs
            const formattedBookings = bookings.map(b => {
                const bJson = b.toJSON ? b.toJSON() : b;
                if (bJson.BookingPlayers && bJson.BookingPlayers.length > 0) {
                    bJson.BookingPlayers = bJson.BookingPlayers.map(p => ({
                        ...p,
                        QRCodeUrl: getFullUrl(p.QRCode)
                    }));
                }
                return bJson;
            });

            res.status(200).json({ success: true, data: formattedBookings });
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
