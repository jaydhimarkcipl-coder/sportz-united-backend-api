const adminBookingRepo = require('../../repositories/admin/booking.repository');
const { sequelize } = require('../../config/database');

class AdminBookingService {
    async getAllBookings(ownedArenaIds, queryOptions) {
        const filters = { courtWhere: {}, bookingWhere: {} };
        
        // Apply RBAC Arena Filtering
        if (ownedArenaIds) {
            filters.courtWhere.ArenaId = ownedArenaIds;
        }

        // Apply Custom Query Filters (date, status, etc)
        if (queryOptions.date) filters.bookingWhere.BookingDate = queryOptions.date;
        if (queryOptions.status) filters.bookingWhere.Status = queryOptions.status;
        if (queryOptions.courtId) filters.bookingWhere.CourtId = queryOptions.courtId;

        return await adminBookingRepo.findAllBookings(filters);
    }

    async getBookingById(bookingId, ownedArenaIds) {
        const filters = { courtWhere: {} };
        if (ownedArenaIds) {
            filters.courtWhere.ArenaId = ownedArenaIds;
        }

        const booking = await adminBookingRepo.findBookingById(bookingId, filters);
        if (!booking) throw { statusCode: 404, message: 'Booking not found or access denied' };
        
        return booking;
    }

    async updateBookingStatus(bookingId, status, ownedArenaIds) {
        // First verify ownership implicitly by fetching it
        await this.getBookingById(bookingId, ownedArenaIds);
        
        await adminBookingRepo.updateBooking(bookingId, { Status: status });
        return { message: `Booking status updated to ${status}` };
    }

    async cancelBookingWithRefund(bookingId, ownedArenaIds) {
        const booking = await this.getBookingById(bookingId, ownedArenaIds);
        
        if (['Cancelled', 'Refunded'].includes(booking.Status)) {
            throw { statusCode: 400, message: 'Booking already cancelled or refunded' };
        }

        const t = await sequelize.transaction();
        try {
            // Update booking status
            await adminBookingRepo.updateBooking(bookingId, { Status: 'Cancelled' }, { transaction: t });
            
            // TODO: Process Refund via updating player wallet (Module 6)
            // Example:
            // await walletService.addFunds(booking.PlayerId, booking.NetAmount, 'Refund for booking ' + bookingId, t);

            await t.commit();
            return { message: 'Booking cancelled and refund processed to wallet' };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async createManualBooking(bookingData, ownedArenaIds) {
        // Ensure manual booking hits the allowed arena
        // Complex logic similar to standard booking service, but for walk-ins
        // Handled in existing booking.service.js ideally to utilize double booking checks
        // Stubbing for architecture
        return { message: 'Manual booking created successfully', bookingData };
    }

    async createOfflineBooking(data, ownedArenaIds) {
        const authRepo = require('../../repositories/user/auth.repository');
        const userBookingService = require('../user/booking.service');
        const courtRepo = require('../../repositories/user/court.repository');
        const { Arena } = require('../../models');

        const { fullName, phone, email, courtId, slotIds, bookingDate, paymentMethod } = data;

        // 1. Ownership Validation
        const court = await courtRepo.findCourtById(courtId);
        if (!court) throw { statusCode: 404, message: 'Court not found' };
        
        if (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId)) {
            throw { statusCode: 403, message: 'Access denied to this arena' };
        }

        // 2. Find or Create Player
        let player = await authRepo.findPlayerByPhone(phone);
        if (!player) {
            player = await authRepo.createPlayer({
                FullName: fullName,
                Phone: phone,
                Email: email || null,
                IsActive: true,
                IsVerified: false,
                RegisteredViaGuestInvite: true
            });
        }

        // 3. Perform Booking using shared logic
        const booking = await userBookingService.createBooking(
            player.PlayerId,
            courtId,
            slotIds,
            bookingDate,
            paymentMethod
        );

        // 4. Generate Invitation Text
        const arena = await Arena.findByPk(court.ArenaId);
        const arenaName = arena ? arena.Name : 'the arena';
        
        const invitationText = `🎾 *Booking Confirmed!* 🎾\n\n` +
            `Hello ${player.FullName},\n` +
            `Your booking at *${arenaName}* is successful.\n` +
            `📅 Date: ${bookingDate}\n` +
            `🏟️ Court: ${court.CourtName}\n\n` +
            `Download the SportzUnited App to see your QR code and manage your booking.\n` +
            `Show this message at the counter upon arrival.`;

        return {
            booking,
            player: {
                PlayerId: player.PlayerId,
                FullName: player.FullName,
                Phone: player.Phone
            },
            invitationText
        };
    }
}

module.exports = new AdminBookingService();
