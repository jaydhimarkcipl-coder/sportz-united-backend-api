const { sequelize } = require('../../config/database');
const bookingRepo = require('../../repositories/user/booking.repository');
const courtRepo = require('../../repositories/user/court.repository');
const paymentService = require('./payment.service');

class BookingService {
    async createBooking(playerId, courtId, slotId, bookingDate, paymentMethod) {
        // Find slot to determine time
        const slot = await courtRepo.findSlotById(slotId);
        if(!slot) throw { statusCode: 404, message: "Court slot not found" };

        const startTime = slot.StartTime;
        const endTime = slot.EndTime;
        
        // Prevent double booking
        const overlaps = await bookingRepo.findOverlappingBookings(courtId, bookingDate, startTime, endTime);
        if (overlaps && overlaps.length > 0) {
            throw { statusCode: 400, message: "The selected slot is already booked for this date." };
        }

        const totalAmount = slot.FinalPrice || slot.BasePrice;
        
        let transaction;
        try {
            transaction = await sequelize.transaction();

            // Insert booking
            const bookingData = {
                BookingCode: `BKG-${Date.now()}`,
                PlayerId: playerId,
                CourtId: courtId,
                BookingDate: bookingDate,
                StartTime: startTime,
                EndTime: endTime,
                TotalAmount: totalAmount,
                NetAmount: totalAmount,
                Status: 'Confirmed',
                Duration: slot.DurationMin
            };

            const detailsData = [{
                SlotId: slotId,
                StartTime: startTime,
                EndTime: endTime,
                Amount: totalAmount,
                IsHalfSlot: slot.IsHalfSlot || false,
                Duration: slot.DurationMin
            }];

            const booking = await bookingRepo.createBookingWithDetailsTransaction(bookingData, detailsData, transaction);

            // Record Payment & Deduct Wallet if applicable
            await paymentService.processPayment({
                BookingId: booking.BookingId,
                PlayerId: playerId,
                Amount: totalAmount,
                PaymentMethod: paymentMethod, // 'Wallet', 'Card', 'UPI'
                TransactionId: `TXN-${Date.now()}`
            }, transaction);

            await transaction.commit();
            return booking;
        } catch (error) {
            if (transaction) await transaction.rollback();
            throw Object.keys(error).includes('statusCode') ? error : { statusCode: 500, message: error.message };
        }
    }

    async getPlayerBookings(playerId) {
        return await bookingRepo.findBookingsByPlayerId(playerId);
    }

    async cancelBooking(bookingId) {
        const booking = await bookingRepo.findBookingById(bookingId);
        if (!booking) throw { statusCode: 404, message: 'Booking not found' };
        if (booking.Status === 'Cancelled') throw { statusCode: 400, message: 'Booking already cancelled' };
        
        return await bookingRepo.updateBookingStatus(bookingId, 'Cancelled');
    }

    async modifyBooking(bookingId, updateData) {
        // Simple modification logic for now
        const booking = await bookingRepo.findBookingById(bookingId);
        if (!booking) throw { statusCode: 404, message: 'Booking not found' };
        
        // The original code was using update function which does not exist on booking object returned here unless it is a sequalize instance, which it is.
        // Wait, the original code in booking.service for modify is:
        //        const booking = await bookingRepo.findBookingById(bookingId);
        //        if (!booking) throw { statusCode: 404, message: 'Booking not found' };
        //        
        //        return await booking.update(updateData);
        //
        return await booking.update(updateData);
    }
}

// Deferred load for circular dependency with paymentService exists? Yes, in original it was:
// module.exports = new BookingService();
module.exports = new BookingService();
