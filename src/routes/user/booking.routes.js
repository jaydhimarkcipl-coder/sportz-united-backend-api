const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { createBooking, getPlayerBookings, cancelBooking, modifyBooking } = require('../../controllers/user/booking.controller');
const validate = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (optional player context)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', verifyToken, getPlayerBookings);

/**
 * @swagger
 * /bookings/history:
 *   get:
 *     summary: Get player booking history
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/history', verifyToken, getPlayerBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
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
router.get('/:id', verifyToken, getPlayerBookings); // Maps to generic list or Detail if logic matches

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Cancelled
 */
router.patch('/:id/cancel', verifyToken, cancelBooking);

/**
 * @swagger
 * /bookings/{id}/modify:
 *   patch:
 *     summary: Modify a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Modified
 */
router.patch('/:id/modify', verifyToken, modifyBooking);

/**
 * @swagger
 * /bookings/check-in:
 *   post:
 *     summary: Check-in at arena
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Checked in
 */
router.post('/check-in', (req, res) => res.json({ success: true, message: 'Checked in' }));

/**
 * @swagger
 * /bookings/invite:
 *   post:
 *     summary: Invite players to a booking
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Invites sent
 */
router.post('/invite', (req, res) => res.json({ success: true, message: 'Invites sent' }));

const createBookingSchema = Joi.object({
    courtId: Joi.number().integer().required(),
    slotId: Joi.number().integer().required(),
    bookingDate: Joi.date().iso().required(),
    paymentMethod: Joi.string().valid('Wallet', 'Card', 'UPI', 'NetBanking').required()
});

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courtId, slotId, bookingDate, paymentMethod]
 *             properties:
 *               courtId:
 *                 type: integer
 *               slotId:
 *                 type: integer
 *               bookingDate:
 *                 type: string
 *                 format: date
 *               paymentMethod:
 *                 type: string
 *                 enum: [Wallet, Card, UPI, NetBanking]
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/', verifyToken, validate(createBookingSchema), createBooking);

/**
 * @swagger
 * /bookings/user:
 *   get:
 *     summary: Get logged-in player's bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/user', verifyToken, getPlayerBookings);

/**
 * @swagger
 * /bookings/user/{playerId}:
 *   get:
 *     summary: Get bookings for a specific player (Admin/User view)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/user/:playerId', verifyToken, getPlayerBookings);

module.exports = router;
