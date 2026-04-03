const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { getMe } = require('../../controllers/user/auth.controller');
const { getPlayerBookings } = require('../../controllers/user/booking.controller');
const { getBalance } = require('../../controllers/user/payment.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const authRepo = require('../../repositories/user/auth.repository');
const { getFullUrl } = require('../../utils/url.util');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

const updateProfileSchema = Joi.object({
    FullName: Joi.string(),
    Email: Joi.string().email()
});

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get player profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/profile', verifyToken, getMe);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update player profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               FullName:
 *                 type: string
 *               Email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/profile', verifyToken, validate(updateProfileSchema), async (req, res, next) => {
    try {
        const result = await authRepo.updatePlayer(req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (e) {
        next(e);
    }
});

/**
 * @swagger
 * /users/bookings:
 *   get:
 *     summary: Get player bookings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/bookings', verifyToken, getPlayerBookings);

/**
 * @swagger
 * /users/wallet:
 *   get:
 *     summary: Get player wallet balance
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/wallet', verifyToken, getBalance);

/**
 * @swagger
 * /users/memberships:
 *   get:
 *     summary: Get user memberships
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/memberships', (req, res) => res.json({ success: true, data: [] }));

/**
 * @swagger
 * /users/upload-avatar:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Uploaded
 */
router.post('/upload-avatar', verifyToken, upload.single('avatar'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const avatarUrl = `/uploads/${req.file.filename}`;
        await authRepo.updatePlayer(req.user.id, { ProfilePhotoUrl: avatarUrl });
        
        res.status(200).json({ success: true, url: getFullUrl(avatarUrl) });
    } catch (e) {
        next(e);
    }
});

/**
 * @swagger
 * /users/invite-player:
 *   post:
 *     summary: Invite a friend to play
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Invited
 */
router.post('/invite-player', (req, res) => res.json({ success: true, message: 'Invite sent' }));

module.exports = router;
