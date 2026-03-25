const { Booking, Court, Player, BookingDetail, CourtSlot } = require('../../models');
const { Op } = require('sequelize');

class AdminBookingRepository {
    async findAllBookings(filters = {}) {
        const courtWhere = filters.courtWhere || {};
        return await Booking.findAll({
            where: filters.bookingWhere || {},
            include: [
                {
                    model: Court,
                    as: 'Court',
                    where: courtWhere
                },
                {
                    model: Player,
                    as: 'Player',
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                }
            ],
            order: [['BookingDate', 'DESC'], ['StartTime', 'DESC']]
        });
    }

    async findBookingById(bookingId, filters = {}) {
        const courtWhere = filters.courtWhere || {};
        return await Booking.findOne({
            where: { BookingId: bookingId },
            include: [
                {
                    model: Court,
                    as: 'Court',
                    where: courtWhere
                },
                {
                    model: Player,
                    as: 'Player',
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                },
                {
                    model: BookingDetail,
                    as: 'BookingDetails',
                    include: [{ model: CourtSlot, as: 'CourtSlot' }]
                }
            ]
        });
    }

    async updateBooking(bookingId, updateData) {
        return await Booking.update(updateData, {
            where: { BookingId: bookingId }
        });
    }

    // Manual booking could reuse the existing booking repository or use a custom one
    async createBooking(bookingData, t) {
        return await Booking.create(bookingData, { transaction: t });
    }
}

module.exports = new AdminBookingRepository();
