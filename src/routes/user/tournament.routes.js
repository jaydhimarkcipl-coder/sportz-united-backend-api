const express = require('express');
const router = express.Router();
const tournamentController = require('../../controllers/user/tournament.controller');
const { verifyToken, optionalVerifyToken } = require('../../middlewares/auth.middleware');
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
        cb(null, 'tournament-player-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * @swagger
 * /tournaments:
 *   get:
 *     summary: Get all upcoming tournaments
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming tournaments
 */
router.get('/', optionalVerifyToken, tournamentController.getTournaments);

/**
 * @swagger
 * /tournaments/my-registrations:
 *   get:
 *     summary: Get tournament registrations for the logged-in user
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tournament registrations
 */
router.get('/my-registrations', verifyToken, tournamentController.getMyRegistrations);

/**
 * @swagger
 * /tournaments/{id}:
 *   get:
 *     summary: Get tournament details
 *     tags: [Tournaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tournament details
 *       404:
 *         description: Tournament not found
 */
router.get('/:id', tournamentController.getTournamentDetails);

/**
 * @swagger
 * /tournaments/{tournamentId}/register:
 *   post:
 *     summary: Register for a tournament
 *     tags: [Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               TeamName:
 *                 type: string
 *                 description: Name of the team (Optional)
 *               Category:
 *                 type: string
 *                 description: Registration category (e.g., Open Category, Above 35 Years)
 *               players:
 *                 type: string
 *                 description: "JSON stringified array of objects: [{\"name\":\"John\",\"phone\":\"123\",\"dob\":\"2000-01-01\",\"gender\":\"Male\",\"email\":\"optional@test.com\",\"photoIndex\":0}]. Fields 'email' and 'photoIndex' are optional."
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Successfully registered
 *       400:
 *         description: Registration error (e.g. closed, already registered, full)
 *       401:
 *         description: Unauthorized
 */
router.post('/:tournamentId/register', verifyToken, upload.any(), tournamentController.register);


module.exports = router;
