const adminReportRepo = require('../../repositories/admin/report.repository');

const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getPeriodDates = (period) => {
    const today = new Date();
    let start, end;

    // Normalize casing if needed
    const normalized = period.toLowerCase();

    if (normalized === 'today') {
        start = new Date(today);
        end = new Date(today);
    } else if (normalized === 'this week' || normalized === 'week') {
        const day = today.getDay();
        const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today.getFullYear(), today.getMonth(), diffToMonday);
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    } else if (normalized === 'this month' || normalized === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    if (start && end) {
        return {
            startDate: formatDate(start),
            endDate: formatDate(end)
        };
    }
    return null;
};

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
        let { startDate, endDate, dateRange, period, timeRange } = queryOptions;
        const range = dateRange || period || timeRange;
        if (range) {
            const periodDates = getPeriodDates(range);
            if (periodDates) {
                startDate = periodDates.startDate;
                endDate = periodDates.endDate;
            }
        }

        const filters = {
            startDate,
            endDate,
            paymentStatus: queryOptions.paymentStatus,
            paymentMethod: queryOptions.paymentMethod,
            arenaId: queryOptions.arenaId,
            page: queryOptions.page,
            limit: queryOptions.limit
        };
        return await adminReportRepo.getTransactionDetailsReport(reqUser.id, reqUser.role, ownedArenaIds, filters);
    }

    async getBookingReport(reqUser, ownedArenaIds, queryOptions) {
        let { startDate, endDate, dateRange, period, timeRange } = queryOptions;
        const range = dateRange || period || timeRange;
        if (range) {
            const periodDates = getPeriodDates(range);
            if (periodDates) {
                startDate = periodDates.startDate;
                endDate = periodDates.endDate;
            }
        }

        const filters = {
            startDate,
            endDate,
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
