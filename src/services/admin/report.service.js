const adminReportRepo = require('../../repositories/admin/report.repository');

class AdminReportService {
    async getRevenue(reqUser, ownedArenaIds) {
        // Superadmin passes null/undefined to see everything, owner passes their ArenaIds
        const arenaFilter = reqUser.role === 'super_admin' ? null : ownedArenaIds;
        return await adminReportRepo.getRevenueReport(arenaFilter);
    }

    async getBookings(reqUser, ownedArenaIds) {
        const arenaFilter = reqUser.role === 'super_admin' ? null : ownedArenaIds;
        return await adminReportRepo.getBookingCountReport(arenaFilter);
    }

    async getOccupancy(reqUser, ownedArenaIds) {
        const arenaFilter = reqUser.role === 'super_admin' ? null : ownedArenaIds;
        const totalBookings = await adminReportRepo.getOccupancyReport(arenaFilter);
        // Sticking to a simple output metric
        return { totalConfirmedBookings: totalBookings, metricType: 'Absolute Booking Count' };
    }

    async getTransactionReport(reqUser, ownedArenaIds, queryOptions) {
        const filters = {
            startDate: queryOptions.startDate,
            endDate: queryOptions.endDate,
            paymentStatus: queryOptions.paymentStatus,
            paymentMethod: queryOptions.paymentMethod,
            arenaId: queryOptions.arenaId,
            page: queryOptions.page,
            limit: queryOptions.limit
        };
        return await adminReportRepo.getTransactionDetailsReport(reqUser.id, reqUser.role, ownedArenaIds, filters);
    }

    async getBookingReport(reqUser, ownedArenaIds, queryOptions) {
        const filters = {
            startDate: queryOptions.startDate,
            endDate: queryOptions.endDate,
            status: queryOptions.status,
            courtId: queryOptions.courtId,
            arenaId: queryOptions.arenaId,
            page: queryOptions.page,
            limit: queryOptions.limit
        };
        return await adminReportRepo.getBookingDetailsReport(ownedArenaIds, filters);
    }
}

module.exports = new AdminReportService();
