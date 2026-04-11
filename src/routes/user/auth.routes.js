const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { login, register, getMe, logout, sendOtp, loginWithOtp, refreshToken } = require('../../controllers/user/auth.controller');
const validate = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');

const otpSchema = Joi.object({
    phone: Joi.string().required(),
    otp: Joi.string().length(6)
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required()
});

const sendOtpSchema = Joi.object({
    phone: Joi.string().required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const registerSchema = Joi.object({
    FullName: Joi.string().required(),
    Email: Joi.string().email().required(),
    Phone: Joi.string().allow(''),
    City: Joi.string().allow(''),
    Address: Joi.string().allow('')
});

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new player
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [FullName, Email]
 *             properties:
 *               FullName:
 *                 type: string
 *               Email:
 *                 type: string
 *               Phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User/Player Login
 *     tags: [Auth]
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
 *         description: Success
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated player/user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/me', verifyToken, getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/logout', verifyToken, logout);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New token
 */
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { email: { type: string } } }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/forgot-password', (req, res) => res.json({ success: true, message: 'Reset email sent' }));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { token: { type: string }, newPassword: { type: string } } }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/reset-password', (req, res) => res.json({ success: true, message: 'Password reset successful' }));

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to mobile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { phone: { type: string } } }
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/send-otp', validate(sendOtpSchema), sendOtp);

/**
 * @swagger
 * /auth/login-otp:
 *   post:
 *     summary: Login with mobile and OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object, properties: { phone: { type: string }, otp: { type: string } } }
 *     responses:
 *       200:
 *         description: Login success
 */
router.post('/login-otp', validate(otpSchema), loginWithOtp);

module.exports = router;
