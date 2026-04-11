const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminBookingController = require('../../controllers/admin/booking.controller');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication, proper roles, and arena ownership context
router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const statusSchema = Joi.object({
    status: Joi.string().valid('confirmed', 'completed', 'no-show').required()
});

/**
 * @swagger
 * /admin/bookings:
 *   get:
 *     summary: View bookings for admin dashboard
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: courtId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminBookingController.getBookings);

/**
 * @swagger
 * /admin/bookings/{id}:
 *   get:
 *     summary: View specific booking details
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', adminBookingController.getBookingById);

const offlineBookingSchema = Joi.object({
    fullName: Joi.string().min(3).required(),
    phone: Joi.string().min(10).required(),
    email: Joi.string().email().optional().allow(null, ''),
    courtId: Joi.number().integer().required(),
    slotIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    bookingDate: Joi.date().iso().required(),
    paymentMethod: Joi.string().valid('Cash', 'Offline', 'Wallet', 'ArenaWallet').required()
});

/**
 * @swagger
 * /admin/bookings/manual:
 *   post:
 *     summary: Manual walk-in booking (Generic)
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/manual', adminBookingController.createManual);

/**
 * @swagger
 * /admin/bookings/offline:
 *   post:
 *     summary: Create offline booking for a new or existing player
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, courtId, slotIds, bookingDate, paymentMethod]
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               courtId:
 *                 type: integer
 *               slotIds:
 *                 type: array
 *                 items: { type: integer }
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               paymentMethod:
 *                 type: string
 *                 enum: [Cash, Offline, Wallet, ArenaWallet]
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/offline', validate(offlineBookingSchema), adminBookingController.createOffline);

/**
 * @swagger
 * /admin/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { status: { type: string, enum: [confirmed, completed, no-show] } } } } }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/:id/status', validate(statusSchema), adminBookingController.updateStatus);

/**
 * @swagger
 * /admin/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking and process refund
 *     tags: [Admin Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cancelled
 */
router.patch('/:id/cancel', adminBookingController.cancelBooking);

module.exports = router;
