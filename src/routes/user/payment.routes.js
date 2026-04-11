const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { getBalance, addPayment } = require('../../controllers/user/payment.controller');
const razorpayController = require('../../controllers/user/razorpay.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');

const addPaymentSchema = Joi.object({
    bookingId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    paymentMethod: Joi.string().required()
});

router.get('/wallet/balance', verifyToken, getBalance);

/**
 * @swagger
 * /payments/wallet/arena/{arenaId}:
 *   get:
 *     summary: Get logged-in player's balance for a specific arena
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Arena specific balance
 */
router.get('/wallet/arena/:arenaId', verifyToken, require('../../controllers/user/payment.controller').getArenaBalance);

/**
 * @swagger
 * /payments/wallet/arenas:
 *   get:
 *     summary: Get all arena balances for the logged-in player (non-zero only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of arena balances
 */
router.get('/wallet/arenas', verifyToken, require('../../controllers/user/payment.controller').getAllArenaBalances);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 */
router.post('/', verifyToken, validate(addPaymentSchema), addPayment);

/**
 * @swagger
 * /payments/razorpay/order:
 *   post:
 *     summary: Create a razorpay order for wallet topup
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in INR
 *     responses:
 *       200:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 */
router.post('/razorpay/order', verifyToken, razorpayController.createOrder);

/**
 * @swagger
 * /payments/razorpay/verify:
 *   post:
 *     summary: Verify Razorpay payment and add to wallet
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, amount]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               amount:
 *                 type: number
 *                 description: Amount in INR
 *     responses:
 *       200:
 *         description: Payment verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 */
router.post('/razorpay/verify', verifyToken, razorpayController.verifyPayment);

/**
 * @swagger
 * /payments/transactions:
 *   get:
 *     summary: Get logged-in player's transaction history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records to return
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 */
router.get('/transactions', verifyToken, razorpayController.getTransactions);

module.exports = router;
