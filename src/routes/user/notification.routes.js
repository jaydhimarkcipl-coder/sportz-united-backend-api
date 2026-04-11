const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const notificationController = require('../../controllers/user/notification.controller');

const registerTokenSchema = Joi.object({
    fcmToken: Joi.string().required(),
    deviceType: Joi.string().valid('Android', 'iOS', 'Web').optional()
});

/**
 * @swagger
 * /notifications/register-token:
 *   post:
 *     summary: Register device FCM token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fcmToken]
 *             properties:
 *               fcmToken: { type: string }
 *               deviceType: { type: string, enum: [Android, iOS, Web] }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/register-token', verifyToken, validate(registerTokenSchema), notificationController.registerToken);

module.exports = router;
