const adminBookingRepo = require('../../repositories/admin/booking.repository');
const { sequelize } = require('../../config/database');
const { Op } = require('sequelize');

const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const getPeriodDates = (period) => {
    if (!period) return null;
    const today = new Date();
    let start;
    let end;
    const normalized = String(period).trim().toLowerCase();

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
            endDate: formatDate(end),
        };
    }
    return null;
};

function applyBookingDateFilter(bookingWhere, queryOptions) {
    let { startDate, endDate, date, dateRange, period, timeRange } = queryOptions;
    const range = dateRange || period || timeRange;
    if (range) {
        const periodDates = getPeriodDates(range);
        if (periodDates) {
            startDate = periodDates.startDate;
            endDate = periodDates.endDate;
        }
    }

    if (date && !startDate && !endDate) {
        bookingWhere.BookingDate = date;
        return;
    }

    if (startDate && endDate) {
        bookingWhere.BookingDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
        bookingWhere.BookingDate = { [Op.gte]: startDate };
    } else if (endDate) {
        bookingWhere.BookingDate = { [Op.lte]: endDate };
    }
}

class AdminBookingService {
    async getAllBookings(ownedArenaIds, queryOptions) {
        const filters = { courtWhere: {}, bookingWhere: {}, transactionWhere: {} };
        
        // Apply RBAC Arena Filtering
        if (ownedArenaIds) {
            filters.courtWhere.ArenaId = ownedArenaIds;
        }

        // Apply Custom Query Filters (date range, status, paymentMethod, etc)
        applyBookingDateFilter(filters.bookingWhere, queryOptions);
        if (queryOptions.status) filters.bookingWhere.Status = queryOptions.status;
        if (queryOptions.courtId) filters.bookingWhere.CourtId = queryOptions.courtId;
        if (queryOptions.paymentMethod) filters.transactionWhere.PaymentMethod = queryOptions.paymentMethod;

        if (queryOptions.type === 'offline') {
            filters.transactionWhere.PaymentMethod = ['Cash', 'Offline', 'ArenaWallet', 'Wallet'];
        } else if (queryOptions.type === 'normal') {
            filters.transactionWhere.PaymentMethod = ['Wallet', 'Razorpay'];
        }

        const pagination = {};
        if (queryOptions.page != null && queryOptions.page !== '') {
            pagination.page = queryOptions.page;
        }
        if (queryOptions.limit != null && queryOptions.limit !== '') {
            pagination.limit = queryOptions.limit;
        }

        return await adminBookingRepo.findAllBookings(filters, pagination);
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
        const paymentService = require('../user/payment.service');
        const booking = await this.getBookingById(bookingId, ownedArenaIds);
        
        if (['Cancelled', 'Refunded'].includes(booking.Status)) {
            throw { statusCode: 400, message: 'Booking already cancelled or refunded' };
        }

        const t = await sequelize.transaction();
        try {
            // 1. Update booking status
            await adminBookingRepo.updateBooking(bookingId, { Status: 'Cancelled' }, { transaction: t });
            
            // 2. Process Refund via updating player wallet
            await paymentService.refundBooking({
                BookingId: booking.BookingId,
                PlayerId: booking.PlayerId,
                Amount: booking.NetAmount,
                Notes: `Admin Cancellation - Booking #${booking.BookingId}`
            }, t);

            await t.commit();
            return { message: 'Booking cancelled and refund processed to wallet' };
        } catch (error) {
            if (t && !t.finished) await t.rollback();
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

    async createOfflineBooking(data, ownedArenaIds) {
        const authRepo = require('../../repositories/user/auth.repository');
        const userBookingService = require('../user/booking.service');
        const courtRepo = require('../../repositories/user/court.repository');
        const { Arena } = require('../../models');

        const { fullName, phone, email, courtId, slotIds, bookingDate, paymentMethod, playerId, amount } = data;

        // 1. Ownership Validation
        const court = await courtRepo.findCourtById(courtId);
        if (!court) throw { statusCode: 404, message: 'Court not found' };
        
        if (ownedArenaIds && !ownedArenaIds.includes(court.ArenaId)) {
            throw { statusCode: 403, message: 'Access denied to this arena' };
        }

        // 2. Find or Create Player (same phone normalization as GET /admin/players/check)
        let player = null;
        const requestedId = parseInt(String(playerId ?? ''), 10);
        if (Number.isFinite(requestedId) && requestedId > 0) {
            player = await authRepo.findPlayerById(requestedId);
        }
        if (!player) {
            player = await authRepo.findPlayerByPhoneFlexible(phone);
        }
        if (!player) {
            const digits = String(phone ?? '').replace(/\D/g, '');
            const local10 = digits.length >= 10 ? digits.slice(-10) : digits;
            const phoneStored =
                String(phone ?? '').trim().startsWith('+') ? String(phone).trim() : `+91${local10}`;
            player = await authRepo.createPlayer({
                FullName: fullName,
                Phone: phoneStored,
                Email: email || null,
                IsActive: true,
                IsVerified: false,
                RegisteredViaGuestInvite: true
            });
        }

        // 3. Perform Booking using shared logic
        const booking = await userBookingService.createBooking(
            player.PlayerId,
            courtId,
            slotIds,
            bookingDate,
            paymentMethod,
            amount
        );

        // 4. Generate Invitation Text
        const arena = await Arena.findByPk(court.ArenaId);
        const arenaName = arena ? arena.Name : 'the arena';
        
        const invitationText = `🎾 *Booking Confirmed!* 🎾\n\n` +
            `Hello ${player.FullName},\n` +
            `Your booking at *${arenaName}* is successful.\n` +
            `📅 Date: ${bookingDate}\n` +
            `🏟️ Court: ${court.CourtName}\n\n` +
            `Download the SportzUnited App to see your QR code and manage your booking.\n` +
            `Show this message at the counter upon arrival.`;

        return {
            booking,
            player: {
                PlayerId: player.PlayerId,
                FullName: player.FullName,
                Phone: player.Phone
            },
            invitationText
        };
    }

    async checkInBooking(bookingId, ownedArenaIds) {
        const booking = await this.getBookingById(bookingId, ownedArenaIds);
        
        if (booking.Status === 'Completed' || booking.Status === 'CheckedIn') {
            throw { statusCode: 400, message: 'Booking is already checked in' };
        }
        if (['Cancelled', 'Refunded', 'no-show'].includes(booking.Status)) {
            throw { statusCode: 400, message: `Cannot check in a ${booking.Status} booking` };
        }

        const { formatTimeToHHMMSS } = require('../../utils/time.util');
        
        let bookingDateStr = booking.BookingDate;
        if (bookingDateStr instanceof Date) {
            bookingDateStr = formatDate(bookingDateStr);
        } else if (typeof bookingDateStr === 'string' && bookingDateStr.includes('T')) {
            bookingDateStr = bookingDateStr.split('T')[0];
        }
        
        let formattedStartTime = formatTimeToHHMMSS(booking.StartTime);
        let formattedEndTime = formatTimeToHHMMSS(booking.EndTime);
        
        const startTimeStr = formattedStartTime.split(':').length === 2 ? `${formattedStartTime}:00` : formattedStartTime;
        const endTimeStr = formattedEndTime.split(':').length === 2 ? `${formattedEndTime}:00` : formattedEndTime;
        
        // Assuming IST +05:30 based on local time
        const startDateTime = new Date(`${bookingDateStr}T${startTimeStr}+05:30`);
        const endDateTime = new Date(`${bookingDateStr}T${endTimeStr}+05:30`);
        
        const now = new Date();

        // Allow check in 60 mins before start
        const allowedStart = new Date(startDateTime.getTime() - 60 * 60000);
        
        if (now < allowedStart) {
            throw { statusCode: 400, message: 'Too early to check in for this booking.' };
        }
        if (now > endDateTime) {
            throw { statusCode: 400, message: 'Booking time has already passed.' };
        }

        await adminBookingRepo.updateBooking(bookingId, { Status: 'Completed' });
        
        booking.Status = 'Completed';
        return booking;
    }

    async getSlotDetails(payload, ownedArenaIds) {
        const { date, slotTime, sportId, courtId } = payload;
        const { Booking, BookingDetail, Court, Player, Transaction } = require('../../models');
        
        const timeParts = slotTime.split(':');
        let formattedTime = slotTime;
        if (timeParts.length === 2) {
            formattedTime = `${slotTime}:00`;
        }

        const courtWhere = { CourtId: courtId };
        if (ownedArenaIds) {
            courtWhere.ArenaId = ownedArenaIds;
        }
        if (sportId) {
            courtWhere.SportId = sportId;
        }

        const booking = await Booking.findOne({
            where: {
                BookingDate: date,
                Status: { [Op.notIn]: ['Cancelled', 'Refunded'] }
            },
            include: [
                {
                    model: Court,
                    as: 'Court',
                    where: courtWhere,
                    required: true
                },
                {
                    model: BookingDetail,
                    where: { 
                        StartTime: { [Op.lte]: formattedTime },
                        EndTime: { [Op.gt]: formattedTime }
                    },
                    required: true
                },
                {
                    model: Player,
                    as: 'Player',
                    required: false
                },
                {
                    model: Transaction,
                    required: false
                }
            ]
        });
        
        if (!booking) {
            return null;
        }
        
        const transactions = booking.Transactions || [];
        const txMethod = transactions.length > 0 ? transactions[0].PaymentMethod : 'Unknown';
        
        return {
            bookedBy: booking.Player ? booking.Player.FullName : 'Unknown',
            bookedOn: booking.CreatedDate,
            paymentMode: txMethod
        };
    }
}

module.exports = new AdminBookingService();
