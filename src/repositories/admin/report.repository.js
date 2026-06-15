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
                    attributes: ['BookingId', 'BookingCode', 'BookingDate', 'StartTime', 'EndTime', 'TotalAmount', 'DiscountAmount', 'GSTAmount', 'NetAmount', 'Status', 'CreatedDate']
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

        const mappedRows = rows.map(r => {
            const row = r.toJSON();
            if (row.CreatedDate) {
                const iso = row.CreatedDate instanceof Date ? row.CreatedDate.toISOString() : String(row.CreatedDate);
                row.CreatedDate = iso.replace('Z', '+05:30');
            }
            if (row.Booking && row.Booking.CreatedDate) {
                const isoB = row.Booking.CreatedDate instanceof Date ? row.Booking.CreatedDate.toISOString() : String(row.Booking.CreatedDate);
                row.Booking.CreatedDate = isoB.replace('Z', '+05:30');
            }
            return row;
        });

        return {
            totalTransactions: count,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            limit: limitNum,
            transactions: mappedRows
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

        const courtInclude = {
            model: Court,
            as: 'Court',
            where: courtWhere,
            required: true,
            attributes: ['CourtId', 'CourtName', 'ArenaId']
        };

        const courtFilter = { ...courtWhere };
        if (courtId) {
            courtFilter.CourtId = parseInt(courtId);
        }
        const courtRows = await Court.findAll({
            where: courtFilter,
            attributes: ['CourtId'],
            raw: true
        });
        const allowedCourtIds = courtRows.map((row) => row.CourtId);

        const amountWhere = { ...bookingWhere };
        let grossAmount = 0;
        let netAmount = 0;

        if (allowedCourtIds.length > 0) {
            const courtAllowed =
                !courtId || allowedCourtIds.includes(parseInt(courtId));
            if (courtAllowed) {
                if (!courtId) {
                    amountWhere.CourtId =
                        allowedCourtIds.length === 1
                            ? allowedCourtIds[0]
                            : { [Op.in]: allowedCourtIds };
                }
                const [grossRaw, netRaw] = await Promise.all([
                    Booking.sum('TotalAmount', { where: amountWhere }),
                    Booking.sum('NetAmount', { where: amountWhere })
                ]);
                grossAmount = grossRaw != null ? Number(grossRaw) : 0;
                netAmount = netRaw != null ? Number(netRaw) : 0;
            }
        }

        const { count, rows } = await Booking.findAndCountAll({
            where: bookingWhere,
            include: [
                {
                    ...courtInclude,
                    include: [{
                        model: Arena,
                        as: 'Arena',
                        required: false,
                        attributes: ['ArenaId', 'Name']
                    }]
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

        const mappedRows = rows.map(r => {
            const row = r.toJSON();
            if (row.CreatedDate) {
                const iso = row.CreatedDate instanceof Date ? row.CreatedDate.toISOString() : String(row.CreatedDate);
                row.CreatedDate = iso.replace('Z', '+05:30');
            }
            return row;
        });

        return {
            totalBookings: count,
            grossAmount: Number.isFinite(grossAmount) ? grossAmount : 0,
            netAmount: Number.isFinite(netAmount) ? netAmount : 0,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum,
            limit: limitNum,
            bookings: mappedRows
        };
    }
}

module.exports = new AdminReportRepository();
