const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { getBalance, addPayment } = require('../../controllers/user/payment.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const addPaymentSchema = Joi.object({
    bookingId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string().required()
});

/**
 * @swagger
 * /payments/wallet/balance:
 *   get:
 *     summary: Get logged-in player's wallet balance
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 */
router.get('/wallet/balance', verifyToken, getBalance);

/**
 * @swagger
 * /payments/wallet/balance/{playerId}:
 *   get:
 *     summary: Get specific player's wallet balance
 *     tags: [Payments]
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
 *         description: Wallet balance
 */
router.get('/wallet/balance/:playerId', verifyToken, getBalance);

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Record a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, amount, paymentMethod]
 *             properties:
 *               bookingId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment recorded
 */
router.post('/', verifyToken, validate(addPaymentSchema), addPayment);

module.exports = router;
