const { sequelize } = require('../../config/database');
const bookingRepo = require('../../repositories/user/booking.repository');
const courtRepo = require('../../repositories/user/court.repository');
const deviceRepo = require('../../repositories/user/device.repository');
const fcmUtil = require('../../utils/fcm.util');
const paymentService = require('./payment.service');
const { Player, Arena, User } = require('../../models');
const { formatTimeToHHMMSS } = require('../../utils/time.util');

class BookingService {
    async createBooking(playerId, courtId, slotIds, bookingDate, paymentMethod) {
        if (!slotIds || slotIds.length === 0) {
            throw { statusCode: 400, message: "No slots selected for booking" };
        }

        // 1. Find all slots and validate
        const slots = await Promise.all(slotIds.map(id => courtRepo.findSlotById(id)));
        if (slots.some(s => !s)) {
            throw { statusCode: 404, message: "One or more selected slots not found" };
        }

        // 2. Prepare detail data and check for overlaps
        const detailsData = [];
        let totalAmount = 0;
        let overallStartTime = null;
        let overallEndTime = null;

        for (const slot of slots) {
            const formattedStartTime = formatTimeToHHMMSS(slot.StartTime);
            const formattedEndTime = formatTimeToHHMMSS(slot.EndTime);

            // Overlap check
            const overlaps = await bookingRepo.findOverlappingBookings(courtId, bookingDate, formattedStartTime, formattedEndTime);
            if (overlaps && overlaps.length > 0) {
                throw { statusCode: 400, message: `The slot ${formattedStartTime} - ${formattedEndTime} is already booked.` };
            }

            const amount = parseFloat(slot.FinalPrice || slot.BasePrice) || 0;
            totalAmount += amount;

            detailsData.push({
                SlotId: slot.SlotId,
                StartTime: formattedStartTime,
                EndTime: formattedEndTime,
                Amount: amount,
                IsHalfSlot: slot.IsHalfSlot || false,
                Duration: slot.DurationMin
            });

            // Tracking overall range for the main booking record
            if (!overallStartTime || formattedStartTime < overallStartTime) overallStartTime = formattedStartTime;
            if (!overallEndTime || formattedEndTime > overallEndTime) overallEndTime = formattedEndTime;
        }
        
        let transaction;
        try {
            transaction = await sequelize.transaction();

            // 3. Find the court to get ArenaId for payment context
            const courtData = await courtRepo.findCourtById(courtId, transaction);
            const arenaId = courtData ? courtData.ArenaId : null;

            // 3. Insert main booking
            const bookingData = {
                BookingCode: `BKG-${Date.now()}`,
                PlayerId: playerId,
                CourtId: courtId,
                BookingDate: bookingDate,
                StartTime: overallStartTime,
                EndTime: overallEndTime,
                TotalAmount: totalAmount,
                NetAmount: totalAmount,
                Status: 'Confirmed',
                Duration: slots.reduce((acc, s) => acc + (s.DurationMin || 0), 0)
            };

            const booking = await bookingRepo.createBookingWithDetailsTransaction(bookingData, detailsData, transaction);

            // 4. Record Payment & Deduct Wallet if applicable
            await paymentService.processPayment({
                BookingId: booking.BookingId,
                PlayerId: playerId,
                Amount: totalAmount,
                PaymentMethod: paymentMethod,
                ArenaId: arenaId,
                TransactionId: `TXN-${Date.now()}`
            }, transaction);

            await transaction.commit();

            // --- Push Notifications ---
            try {
                // 1. Notify Player
                const playerTokens = await deviceRepo.getTokensByPlayerId(playerId);
                const player = await Player.findByPk(playerId);
                const arena = await Arena.findByPk(arenaId);
                
                if (playerTokens.length > 0) {
                    await fcmUtil.sendToMultipleDevices(playerTokens, {
                        title: 'Booking Confirmed! ⚽',
                        body: `Your booking at ${arena.Name} for ${bookingDate} (${overallStartTime}-${overallEndTime}) is confirmed. ID: ${booking.BookingCode}`
                    });
                }

                // 2. Notify Arena Owner
                if (arena && arena.OwnerUserId) {
                    const ownerTokens = await deviceRepo.getTokensByUserId(arena.OwnerUserId);
                    if (ownerTokens.length > 0) {
                        await fcmUtil.sendToMultipleDevices(ownerTokens, {
                            title: `New Booking: ${player.FullName} 💸`,
                            body: `A new booking (${booking.BookingCode}) has been made for ${courtData.CourtName} at ${overallStartTime}-${overallEndTime}.`
                        });
                    }
                }
            } catch (notifError) {
                console.error('--- PUSH NOTIFICATION ERROR (CREATE) ---', notifError);
            }

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
        
        let transaction;
        try {
            transaction = await sequelize.transaction();

            // Only refund if booking was confirmed and had a value
            if (booking.Status === 'Confirmed' && parseFloat(booking.NetAmount) > 0) {
                await paymentService.refundBooking({
                    BookingId: booking.BookingId,
                    PlayerId: booking.PlayerId,
                    Amount: booking.NetAmount,
                    Notes: `Automatic Refund for Cancellation: ${booking.BookingCode}`
                }, transaction);
            }

            const updated = await booking.update({ Status: 'Cancelled' }, { transaction });

            await transaction.commit();

            // --- Push Notifications ---
            try {
                // 1. Notify Player
                const playerTokens = await deviceRepo.getTokensByPlayerId(booking.PlayerId);
                if (playerTokens.length > 0) {
                    await fcmUtil.sendToMultipleDevices(playerTokens, {
                        title: 'Booking Cancelled ❌',
                        body: `Your booking ${booking.BookingCode} has been cancelled. If applicable, your refund has been processed to your wallet.`
                    });
                }

                // 2. Notify Owner
                const court = await courtRepo.findCourtById(booking.CourtId);
                const arena = await Arena.findByPk(court.ArenaId);
                const player = await Player.findByPk(booking.PlayerId);
                
                if (arena && arena.OwnerUserId) {
                    const ownerTokens = await deviceRepo.getTokensByUserId(arena.OwnerUserId);
                    if (ownerTokens.length > 0) {
                        await fcmUtil.sendToMultipleDevices(ownerTokens, {
                            title: 'Booking Cancelled ⚠️',
                            body: `The booking ${booking.BookingCode} by ${player.FullName} has been cancelled.`
                        });
                    }
                }
            } catch (notifError) {
                console.error('--- PUSH NOTIFICATION ERROR (CANCEL) ---', notifError);
            }

            return updated;
        } catch (error) {
            console.error('--- CANCEL BOOKING REFUND ERROR ---', error);
            if (transaction) await transaction.rollback();
            throw error;
        }
    }

    async modifyBooking(bookingId, updateData) {
        const booking = await bookingRepo.findBookingById(bookingId);
        if (!booking) throw { statusCode: 404, message: 'Booking not found' };
        
        return await booking.update(updateData);
    }
}

module.exports = new BookingService();
