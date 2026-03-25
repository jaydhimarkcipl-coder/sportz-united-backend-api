const { Booking, Transaction, Court, CourtSlot } = require('../../models');
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
}

module.exports = new AdminReportRepository();
