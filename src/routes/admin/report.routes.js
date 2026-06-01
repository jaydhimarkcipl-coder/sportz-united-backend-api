const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminReportController = require('../../controllers/admin/report.controller');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

/**
 * @swagger
 * /admin/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/revenue', adminReportController.getRevenue);

/**
 * @swagger
 * /admin/reports/bookings:
 *   get:
 *     summary: Get booking counts report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/bookings', adminReportController.getBookings);

/**
 * @swagger
 * /admin/reports/occupancy:
 *   get:
 *     summary: Get simplistic occupancy report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/occupancy', adminReportController.getOccupancy);

/**
 * @swagger
 * /admin/reports/transaction-report:
 *   get:
 *     summary: Get detailed transaction report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: Filter transactions up to this date (YYYY-MM-DD)
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string }
 *         description: Filter by payment status (e.g. Success, Failed, Pending)
 *       - in: query
 *         name: paymentMethod
 *         schema: { type: string }
 *         description: Filter by payment method (e.g. Razorpay, Wallet, Cash, Offline)
 *       - in: query
 *         name: arenaId
 *         schema: { type: integer }
 *         description: Filter by specific Arena ID (For Super Admin or owners with multiple arenas)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/transaction-report', adminReportController.getTransactionReport);

/**
 * @swagger
 * /admin/reports/booking-report:
 *   get:
 *     summary: Get detailed booking report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: Filter bookings from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: Filter bookings up to this date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by booking status (e.g. Confirmed, Cancelled, Completed)
 *       - in: query
 *         name: courtId
 *         schema: { type: integer }
 *         description: Filter by specific Court ID
 *       - in: query
 *         name: arenaId
 *         schema: { type: integer }
 *         description: Filter by specific Arena ID (For Super Admin or owners with multiple arenas)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/booking-report', adminReportController.getBookingReport);

module.exports = router;
