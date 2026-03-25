const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminWalletController = require('../../controllers/admin/wallet.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const topupSchema = Joi.object({
    playerId: Joi.number().required(),
    amount: Joi.number().positive().required(),
    arenaId: Joi.number() // Optional if owner has only 1 arena
});

/**
 * @swagger
 * /admin/wallet/{playerId}:
 *   get:
 *     summary: View specific player's wallet balance
 *     tags: [Admin Wallet & Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/wallet/:playerId', adminWalletController.getWallet);

/**
 * @swagger
 * /admin/wallet/topup:
 *   post:
 *     summary: Offline wallet top-up by admin
 *     tags: [Admin Wallet & Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId, amount]
 *             properties:
 *               playerId: { type: integer }
 *               amount: { type: number }
 *               arenaId: { type: integer, description: "Required if admin owns multiple arenas" }
 *     responses:
 *       200:
 *         description: Top-up successful
 */
router.post('/wallet/topup', validate(topupSchema), adminWalletController.topup);

/**
 * @swagger
 * /admin/transactions:
 *   get:
 *     summary: View transaction logs for owned arenas
 *     tags: [Admin Wallet & Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/transactions', adminWalletController.getTransactions);

module.exports = router;
