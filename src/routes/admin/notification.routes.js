const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const adminNotifController = require('../../controllers/admin/notification.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));

const notifSchema = Joi.object({
    playerId: Joi.number().optional(), // If specific
    targetType: Joi.string().valid('all', 'specific', 'arena_players').required(),
    title: Joi.string().required(),
    message: Joi.string().required()
});

/**
 * @swagger
 * /admin/notifications/send:
 *   post:
 *     summary: Send notification to users
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, title, message]
 *             properties:
 *               targetType: { type: string, enum: [all, specific, arena_players] }
 *               playerId: { type: integer, description: "Required if targetType is specific" }
 *               title: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Notification sent
 */
router.post('/send', validate(notifSchema), adminNotifController.send);

/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Get notification history sent by admin
 *     tags: [Admin Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminNotifController.getHistory);

module.exports = router;
