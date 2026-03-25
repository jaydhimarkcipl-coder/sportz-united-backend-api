const express = require('express');
const router = express.Router();
const Joi = require('joi');
const adminAuthController = require('../../controllers/admin/auth.controller');
const validate = require('../../middlewares/validate.middleware');

const adminLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     summary: Super Admin & Arena Owner Login
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(adminLoginSchema), adminAuthController.login);

/**
 * @swagger
 * /admin/auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 */
router.post('/refresh', validate(Joi.object({ refreshToken: Joi.string().required() })), adminAuthController.refresh);

/**
 * @swagger
 * /admin/auth/logout:
 *   post:
 *     summary: Logout and Revoke Refresh Token
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', validate(Joi.object({ refreshToken: Joi.string().required() })), adminAuthController.logout);

module.exports = router;
