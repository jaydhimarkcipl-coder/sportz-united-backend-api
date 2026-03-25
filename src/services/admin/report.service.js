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
}

module.exports = new AdminReportService();
