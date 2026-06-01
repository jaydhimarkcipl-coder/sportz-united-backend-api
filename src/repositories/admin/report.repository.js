const { Booking, Transaction, Court, CourtSlot, Arena, Player } = require('../../models');
const { Op, fn, col } = require('sequelize');

class AdminReportRepository {
    async getRevenueReport(arenaIds) {
        return await Transaction.findAll({
            attributes: [
                'PaymentStatus',
                [fn('SUM', col('Amount')), 'TotalRevenue']
            ],
            include: [{
                model: Booking,
                as: 'Booking',
                attributes: [],
                include: [{
                    model: Court,
                    as: 'Court',
                    attributes: [],
                    where: arenaIds ? { ArenaId: arenaIds } : {}
                }]
            }],
            group: ['PaymentStatus']
        });
    }

    async getBookingCountReport(arenaIds) {
        return await Booking.findAll({
            attributes: [
                'Status',
                [fn('COUNT', col('BookingId')), 'BookingCount']
            ],
            include: [{
                model: Court,
                as: 'Court',
                attributes: [],
                where: arenaIds ? { ArenaId: arenaIds } : {}
            }],
            group: ['Status']
        });
    }

    // A simplified occupancy metric: count total booked slots mapped to owned arenas
    async getOccupancyReport(arenaIds) {
        // Here we just count how many slots are attached to bookings
        // In a real scenario, you'd compare booked slots vs total available slots
        return await Booking.count({
            where: { Status: 'Confirmed' },
            include: [{
                model: Court,
                as: 'Court',
                where: arenaIds ? { ArenaId: arenaIds } : {}
            }]
        });
    }

    async getTransactionDetailsReport(userId, role, ownedArenaIds, filters = {}) {
        const { startDate, endDate, paymentStatus, paymentMethod, arenaId, page, limit } = filters;
        const where = {};

        // Date filter on CreatedDate
        if (startDate && endDate) {
            where.CreatedDate = {
                [Op.between]: [new Date(startDate + ' 00:00:00'), new Date(endDate + ' 23:59:59')]
            };
        } else if (startDate) {
            where.CreatedDate = {
                [Op.gte]: new Date(startDate + ' 00:00:00')
            };
        } else if (endDate) {
            where.CreatedDate = {
                [Op.lte]: new Date(endDate + ' 23:59:59')
            };
        }

        if (paymentStatus) {
            where.PaymentStatus = paymentStatus;
        }
        if (paymentMethod) {
            where.PaymentMethod = paymentMethod;
        }

        // Apply RBAC filters
        if (role !== 'super_admin') {
            // Arena owner: Only see transactions associated with their owned arenas OR top-ups they performed
            const orConditions = [{ TopUpByArenaUserId: userId }];
            
            if (ownedArenaIds && ownedArenaIds.length > 0) {
                if (arenaId) {
                    const parsedArenaId = parseInt(arenaId);
                    if (ownedArenaIds.includes(parsedArenaId)) {
                        orConditions.push({ '$Booking.Court.ArenaId$': parsedArenaId });
                    } else {
                        // Requested arena is not owned by them; restrict
                        orConditions.push({ '$Booking.Court.ArenaId$': -1 });
                    }
                } else {
                    orConditions.push({ '$Booking.Court.ArenaId$': { [Op.in]: ownedArenaIds } });
                }
            }
            where[Op.or] = orConditions;
        } else {
            // Super Admin:
            if (arenaId) {
                where['$Booking.Court.ArenaId$'] = parseInt(arenaId);
            }
        }

        // Pagination settings
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offsetNum = (pageNum - 1) * limitNum;

        const { count, rows } = await Transaction.findAndCountAll({
            where,
            include: [
                {
                    model: Booking,
                    as: 'Booking',
                    required: false,
                    include: [{
                        model: Court,
                        as: 'Court',
                        required: false,
                        include: [{
                            model: Arena,
                            as: 'Arena',
                            required: false,
                            attributes: ['ArenaId', 'Name']
                        }],
                        attributes: ['CourtId', 'CourtName', 'ArenaId']
                    }],
                    attributes: ['BookingId', 'BookingCode', 'BookingDate', 'StartTime', 'EndTime', 'TotalAmount', 'DiscountAmount', 'GSTAmount', 'NetAmount', 'Status']
                },
                {
                    model: Player,
                    as: 'Player',
                    required: false,
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                }
            ],
            order: [['CreatedDate', 'DESC']],
            limit: limitNum,
            offset: offsetNum,
            distinct: true
        });

        return {
            totalTransactions: count,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            limit: limitNum,
            transactions: rows
        };
    }

    async getBookingDetailsReport(ownedArenaIds, filters = {}) {
        const { startDate, endDate, status, courtId, arenaId, page, limit } = filters;
        const bookingWhere = {};

        // Date filter on BookingDate
        if (startDate && endDate) {
            bookingWhere.BookingDate = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            bookingWhere.BookingDate = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            bookingWhere.BookingDate = {
                [Op.lte]: endDate
            };
        }

        if (status) {
            bookingWhere.Status = status;
        }
        if (courtId) {
            bookingWhere.CourtId = parseInt(courtId);
        }

        // Arena filter (RBAC + optional query filter)
        const courtWhere = {};
        if (ownedArenaIds) {
            // Arena owner login
            if (arenaId) {
                const parsedArenaId = parseInt(arenaId);
                if (ownedArenaIds.includes(parsedArenaId)) {
                    courtWhere.ArenaId = parsedArenaId;
                } else {
                    courtWhere.ArenaId = -1;
                }
            } else {
                courtWhere.ArenaId = { [Op.in]: ownedArenaIds };
            }
        } else {
            // Super Admin login
            if (arenaId) {
                courtWhere.ArenaId = parseInt(arenaId);
            }
        }

        // Pagination settings
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const offsetNum = (pageNum - 1) * limitNum;

        const { count, rows } = await Booking.findAndCountAll({
            where: bookingWhere,
            include: [
                {
                    model: Court,
                    as: 'Court',
                    where: courtWhere,
                    required: true,
                    include: [{
                        model: Arena,
                        as: 'Arena',
                        required: false,
                        attributes: ['ArenaId', 'Name']
                    }],
                    attributes: ['CourtId', 'CourtName', 'ArenaId']
                },
                {
                    model: Player,
                    as: 'Player',
                    required: false,
                    attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
                },
                {
                    model: Transaction,
                    required: false,
                    attributes: ['PaymentId', 'PaymentMethod', 'PaymentStatus', 'Amount', 'PaymentType', 'TransactionId', 'CreatedDate']
                }
            ],
            order: [['BookingDate', 'DESC'], ['StartTime', 'DESC']],
            limit: limitNum,
            offset: offsetNum,
            distinct: true
        });

        return {
            totalBookings: count,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            limit: limitNum,
            bookings: rows
        };
    }
}

module.exports = new AdminReportRepository();
