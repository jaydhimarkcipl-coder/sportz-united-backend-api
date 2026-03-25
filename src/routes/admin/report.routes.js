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

module.exports = router;
