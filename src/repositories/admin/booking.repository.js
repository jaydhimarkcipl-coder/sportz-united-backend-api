const { Booking, Court, Player, BookingDetail, CourtSlot } = require('../../models');
const { Op } = require('sequelize');

class AdminBookingRepository {
    normalizeTransactionWhere(transactionWhere = {}) {
        if (!transactionWhere || typeof transactionWhere !== 'object') {
            return {};
        }
        const where = { ...transactionWhere };
        if (Array.isArray(where.PaymentMethod)) {
            where.PaymentMethod = { [Op.in]: where.PaymentMethod };
        }
        return where;
    }

    buildBookingListQuery(filters = {}) {
        const { Transaction } = require('../../models');
        const courtWhere = filters.courtWhere || {};
        const transactionWhere = this.normalizeTransactionWhere(
            filters.transactionWhere || {},
        );
        const hasTransactionFilter = Object.keys(transactionWhere).length > 0;

        return {
            where: filters.bookingWhere || {},
            include: [
                {
                    model: Court,
                    as: 'Court',
                    where: courtWhere,
                    required: Object.keys(courtWhere).length > 0,
                },
                {
                    model: Player,
                    as: 'Player',
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email'],
                    required: false,
                },
                {
                    model: Transaction,
                    where: transactionWhere,
                    required: hasTransactionFilter,
                },
            ],
            order: [
                ['BookingDate', 'DESC'],
                ['StartTime', 'DESC'],
            ],
        };
    }

    async findAllBookings(filters = {}, pagination = {}) {
        const query = this.buildBookingListQuery(filters);
        const pageNum = parseInt(pagination.page, 10);
        const limitNum = parseInt(pagination.limit, 10);
        const usePagination =
            Number.isFinite(pageNum) &&
            pageNum > 0 &&
            Number.isFinite(limitNum) &&
            limitNum > 0;

        if (!usePagination) {
            return Booking.findAll(query);
        }

        const offsetNum = (pageNum - 1) * limitNum;
        const { count, rows } = await Booking.findAndCountAll({
            ...query,
            limit: limitNum,
            offset: offsetNum,
            distinct: true,
        });

        return {
            bookings: rows,
            totalBookings: count,
            totalPages: Math.ceil(count / limitNum) || 1,
            currentPage: pageNum,
            limit: limitNum,
        };
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
