const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const superBookingController = require('../../controllers/super-admin/booking.controller');

// Strictly Super Admin only
router.use(verifyToken);
router.use(allowRoles('super_admin'));

/**
 * @swagger
 * /super-admin/bookings:
 *   delete:
 *     summary: Clear all bookings globally (Super Admin only - destructive)
 *     tags: [Super Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/', superBookingController.clearAll);

module.exports = router;
