const cron = require('node-cron');
const { Booking, Player, Court, Arena, UserDevice, sequelize } = require('../models');
const { Op } = require('sequelize');
const fcmUtil = require('../utils/fcm.util');

const startNotificationJobs = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            console.log('[CRON] Running Booking Notifications Job...');
            const now = new Date();
            
            // Current local time (assuming IST +05:30 based on previous logic)
            // But we should use UTC dates to compare with DB if DB is UTC, or format them.
            // Let's get current time in IST
            const istOffset = 5.5 * 60 * 60000;
            const istTime = new Date(now.getTime() + istOffset);
            
            const todayDateStr = istTime.toISOString().split('T')[0];
            
            // 40 Mins Before: +40 mins
            const upcomingFromNow = new Date(istTime.getTime() + 40 * 60000);
            const upcomingHH = String(upcomingFromNow.getUTCHours()).padStart(2, '0');
            const upcomingMM = String(upcomingFromNow.getUTCMinutes()).padStart(2, '0');
            const upcomingTimeStr = `${upcomingHH}:${upcomingMM}:00`;
            
            // 15 Mins After End: -15 mins
            const fifteenMinsAgo = new Date(istTime.getTime() - 15 * 60000);
            const fifteenAgoHH = String(fifteenMinsAgo.getUTCHours()).padStart(2, '0');
            const fifteenAgoMM = String(fifteenMinsAgo.getUTCMinutes()).padStart(2, '0');
            const fifteenAgoTimeStr = `${fifteenAgoHH}:${fifteenAgoMM}:00`;

            // Note: In SQL Server, TIME columns are often retrieved as Date objects or strings,
            // but when querying, we can compare string to TIME.
            // Because cron runs every minute, we check exactly the HH:MM
            // We use LIKE or EXACT match if it ignores seconds. Let's match by hour and minute exactly.

            // 1. Upcoming Bookings (1 hour before StartTime)
            const upcomingBookings = await Booking.findAll({
                where: {
                    BookingDate: todayDateStr,
                    Status: 'Confirmed', // Only notify if confirmed
                    [Op.and]: [
                        sequelize.where(
                            sequelize.fn('LEFT', sequelize.col('StartTime'), 5),
                            `${upcomingHH}:${upcomingMM}`
                        )
                    ]
                },
                include: [
                    { model: Player, as: 'Player' },
                    { model: Court, as: 'Court', include: [{ model: Arena, as: 'Arena' }] }
                ]
            });

            for (const booking of upcomingBookings) {
                if (!booking.Player) continue;
                console.log(`[CRON] Sending 40-min reminder for BookingId: ${booking.BookingId}`);
                
                // Get player FCM tokens
                const devices = await UserDevice.findAll({ where: { UserId: booking.PlayerId, UserType: 'Player' } });
                const tokens = devices.map(d => d.FcmToken).filter(t => t);
                
                if (tokens.length > 0) {
                    try {
                        await fcmUtil.sendToMultipleDevices(tokens, {
                            title: 'Upcoming Turf Booking! 🕒',
                            body: `Your booking at ${booking.Court?.Arena?.Name || 'the turf'} starts in 40 minutes. Get ready!`,
                            data: { bookingId: String(booking.BookingId) }
                        });
                    } catch (fcmErr) {
                        console.error(`[CRON] FCM Error for BookingId: ${booking.BookingId}`, fcmErr.message);
                    }
                }
            }

            // 2. Concluded Bookings (15 mins after EndTime)
            const concludedBookings = await Booking.findAll({
                where: {
                    BookingDate: todayDateStr,
                    Status: 'Completed', // or Confirmed if they didn't manually check in
                    [Op.and]: [
                        sequelize.where(
                            sequelize.fn('LEFT', sequelize.col('EndTime'), 5),
                            `${fifteenAgoHH}:${fifteenAgoMM}`
                        )
                    ]
                },
                include: [
                    { model: Player, as: 'Player' },
                    { model: Court, as: 'Court', include: [{ model: Arena, as: 'Arena' }] }
                ]
            });

            for (const booking of concludedBookings) {
                if (!booking.Player) continue;
                console.log(`[CRON] Sending post-match notification for BookingId: ${booking.BookingId}`);
                
                // Get player FCM tokens
                const devices = await UserDevice.findAll({ where: { UserId: booking.PlayerId, UserType: 'Player' } });
                const tokens = devices.map(d => d.FcmToken).filter(t => t);
                
                if (tokens.length > 0) {
                    try {
                        await fcmUtil.sendToMultipleDevices(tokens, {
                            title: 'Hope you had a great game! ⚽',
                            body: `We hope you enjoyed your time at ${booking.Court?.Arena?.Name || 'the turf'}. Please leave a review!`,
                            data: { bookingId: String(booking.BookingId) }
                        });
                    } catch (fcmErr) {
                        console.error(`[CRON] FCM Error for BookingId: ${booking.BookingId}`, fcmErr.message);
                    }
                }
            }

        } catch (error) {
            console.error('[CRON ERROR]', error);
        }
    });
};

module.exports = { startNotificationJobs };
