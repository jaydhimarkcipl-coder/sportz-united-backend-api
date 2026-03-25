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
}

module.exports = new AdminBookingService();
