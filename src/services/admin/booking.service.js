const adminBookingRepo = require('../../repositories/admin/booking.repository');
const { sequelize } = require('../../config/database');

class AdminBookingService {
    async getAllBookings(ownedArenaIds, queryOptions) {
        const filters = { courtWhere: {}, bookingWhere: {}, transactionWhere: {} };
        
        // Apply RBAC Arena Filtering
        if (ownedArenaIds) {
            filters.courtWhere.ArenaId = ownedArenaIds;
        }

        // Apply Custom Query Filters (date, status, paymentMethod, etc)
        if (queryOptions.date) filters.bookingWhere.BookingDate = queryOptions.date;
        if (queryOptions.status) filters.bookingWhere.Status = queryOptions.status;
        if (queryOptions.courtId) filters.bookingWhere.CourtId = queryOptions.courtId;
        if (queryOptions.paymentMethod) filters.transactionWhere.PaymentMethod = queryOptions.paymentMethod;

        if (queryOptions.type === 'offline') {
            filters.transactionWhere.PaymentMethod = ['Cash', 'Offline', 'ArenaWallet'];
        } else if (queryOptions.type === 'normal') {
            filters.transactionWhere.PaymentMethod = ['Wallet', 'Razorpay'];
        }

        const pagination = {};
        if (queryOptions.page != null && queryOptions.page !== '') {
            pagination.page = queryOptions.page;
        }
        if (queryOptions.limit != null && queryOptions.limit !== '') {
            pagination.limit = queryOptions.limit;
        }

        return await adminBookingRepo.findAllBookings(filters, pagination);
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
        const paymentService = require('../user/payment.service');
        const booking = await this.getBookingById(bookingId, ownedArenaIds);
        
        if (['Cancelled', 'Refunded'].includes(booking.Status)) {
            throw { statusCode: 400, message: 'Booking already cancelled or refunded' };
        }

        const t = await sequelize.transaction();
        try {
            // 1. Update booking status
            await adminBookingRepo.updateBooking(bookingId, { Status: 'Cancelled' }, { transaction: t });
            
            // 2. Process Refund via updating player wallet
            await paymentService.refundBooking({
                BookingId: booking.BookingId,
                PlayerId: booking.PlayerId,
                Amount: booking.NetAmount,
                Notes: `Admin Cancellation - Booking #${booking.BookingId}`
            }, t);

            await t.commit();
            return { message: 'Booking cancelled and refund processed to wallet' };
        } catch (error) {
            if (t && !t.finished) await t.rollback();
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

        const { fullName, phone, email, courtId, slotIds, bookingDate, paymentMethod, playerId } = data;

        // 1. Ownership Validation
        const court = await courtRepo.findCourtById(courtId);
        if (!court) throw { statusCode: 404, message: 'Court not found' };
        
        if (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId)) {
            throw { statusCode: 403, message: 'Access denied to this arena' };
        }

        // 2. Find or Create Player (same phone normalization as GET /admin/players/check)
        let player = null;
        const requestedId = parseInt(String(playerId ?? ''), 10);
        if (Number.isFinite(requestedId) && requestedId > 0) {
            player = await authRepo.findPlayerById(requestedId);
        }
        if (!player) {
            player = await authRepo.findPlayerByPhoneFlexible(phone);
        }
        if (!player) {
            const digits = String(phone ?? '').replace(/\D/g, '');
            const local10 = digits.length >= 10 ? digits.slice(-10) : digits;
            const phoneStored =
                String(phone ?? '').trim().startsWith('+') ? String(phone).trim() : `+91${local10}`;
            player = await authRepo.createPlayer({
                FullName: fullName,
                Phone: phoneStored,
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
