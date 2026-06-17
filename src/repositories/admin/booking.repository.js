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
        const { Transaction, Arena } = require('../../models');
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
                    include: [
                        {
                            model: Arena,
                            as: 'Arena',
                            required: false,
                            attributes: ['ArenaId', 'Name']
                        }
                    ]
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
            const rows = await Booking.findAll(query);
            const mappedRows = rows.map(r => {
                const row = r.toJSON();
                // Transaction is a hasMany relation, so it comes as an array "Transactions"
                const transactions = row.Transactions || [];
                const txMethod = transactions.length > 0 ? transactions[0].PaymentMethod : '';
                const txStatus = transactions.length > 0 ? transactions[0].PaymentStatus : '';
                const isOffline = ['Cash', 'Offline', 'Offline/Admin', 'ArenaWallet'].includes(txMethod);
                row.IsOffline = isOffline;
                row.BookingSource = isOffline ? 'Turf / Offline' : 'Online / App';
                row.PaymentMethod = txMethod;
                row.PaymentStatus = txStatus;
                
                if (row.CreatedDate) {
                    const iso = row.CreatedDate instanceof Date ? row.CreatedDate.toISOString() : String(row.CreatedDate);
                    row.CreatedDate = iso.replace('Z', '+05:30');
                }
                
                return row;
            });
            return {
                bookings: mappedRows,
                totalBookings: mappedRows.length,
                totalPages: 1,
                currentPage: 1,
                limit: mappedRows.length || 10,
            };
        }

        const offsetNum = (pageNum - 1) * limitNum;
        const { count, rows } = await Booking.findAndCountAll({
            ...query,
            limit: limitNum,
            offset: offsetNum,
            distinct: true,
        });

        const mappedRows = rows.map(r => {
            const row = r.toJSON();
            // Transaction is a hasMany relation, so it comes as an array "Transactions"
            const transactions = row.Transactions || [];
            const txMethod = transactions.length > 0 ? transactions[0].PaymentMethod : '';
            const txStatus = transactions.length > 0 ? transactions[0].PaymentStatus : '';
            const isOffline = ['Cash', 'Offline', 'Offline/Admin', 'ArenaWallet'].includes(txMethod);
            row.IsOffline = isOffline;
            row.BookingSource = isOffline ? 'Turf / Offline' : 'Online / App';
            row.PaymentMethod = txMethod;
            row.PaymentStatus = txStatus;
            
            if (row.CreatedDate) {
                const iso = row.CreatedDate instanceof Date ? row.CreatedDate.toISOString() : String(row.CreatedDate);
                row.CreatedDate = iso.replace('Z', '+05:30');
            }

            return row;
        });

        return {
            bookings: mappedRows,
            totalBookings: count,
            totalPages: Math.ceil(count / limitNum) || 1,
            currentPage: pageNum,
            limit: limitNum,
        };
    }

    async findBookingById(bookingId, filters = {}) {
        const { Transaction } = require('../../models');
        const courtWhere = filters.courtWhere || {};
        const bookingIdStr = String(bookingId);
        const parsedId = parseInt(bookingId, 10);
        
        const conditions = [
            { BookingCode: bookingIdStr },
            { BookingCode: `BKG-${bookingIdStr}` }
        ];

        if (!isNaN(parsedId)) {
            conditions.push({ BookingId: parsedId });
        }

        const whereClause = { [Op.or]: conditions };
            
        const booking = await Booking.findOne({
            where: whereClause,
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
                },
                {
                    model: Transaction,
                    required: false
                }
            ]
        });

        if (!booking) return null;

        const row = booking.toJSON();
        const transactions = row.Transactions || [];
        const txMethod = transactions.length > 0 ? transactions[0].PaymentMethod : '';
        const txStatus = transactions.length > 0 ? transactions[0].PaymentStatus : '';
        const isOffline = ['Cash', 'Offline', 'Offline/Admin', 'ArenaWallet'].includes(txMethod);
        row.IsOffline = isOffline;
        row.BookingSource = isOffline ? 'Turf / Offline' : 'Online / App';
        row.PaymentMethod = txMethod;
        row.PaymentStatus = txStatus;
        
        if (row.CreatedDate) {
            const iso = row.CreatedDate instanceof Date ? row.CreatedDate.toISOString() : String(row.CreatedDate);
            row.CreatedDate = iso.replace('Z', '+05:30');
        }

        return row;
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
