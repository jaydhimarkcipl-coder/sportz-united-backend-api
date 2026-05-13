const express = require('express');
const router = express.Router();
const tournamentController = require('../../controllers/admin/tournament.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { isAdmin, isSuperAdmin } = require('../../middlewares/role.middleware');

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
        cb(null, 'tournament-' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB per file
        fieldSize: 20 * 1024 * 1024 // 20MB for text fields (JSON/Base64)
    }
});

// Protect all admin routes
router.use(verifyToken);
router.use((req, res, next) => {
    if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin' || req.user.type === 'Admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied' });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Tournament:
 *       type: object
 *       required:
 *         - Name
 *         - SportId
 *         - StartDate
 *         - EndDate
 *         - RegistrationStartDate
 *         - RegistrationEndDate
 *         - MaxParticipants
 *       properties:
 *         Name:
 *           type: string
 *         Description:
 *           type: string
 *         SportId:
 *           type: integer
 *         ArenaId:
 *           type: integer
 *         StartDate:
 *           type: string
 *           format: date-time
 *         EndDate:
 *           type: string
 *           format: date-time
 *         RegistrationStartDate:
 *           type: string
 *           format: date-time
 *         RegistrationEndDate:
 *           type: string
 *           format: date-time
 *         MaxParticipants:
 *           type: integer
 *         EntryFee:
 *           type: number
 *         Status:
 *           type: string
 *           enum: [Upcoming, Ongoing, Completed, Cancelled]
 */

/**
 * @swagger
 * /admin/tournaments:
 *   post:
 *     summary: Create a new tournament
 *     tags: [Admin Tournaments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               Name: { type: string }
 *               Description: { type: string }
 *               SportId: { type: integer }
 *               ArenaId: { type: integer, nullable: true }
 *               Venue: { type: string }
 *               StartDate: { type: string, format: date-time }
 *               EndDate: { type: string, format: date-time }
 *               RegistrationStartDate: { type: string, format: date-time }
 *               RegistrationEndDate: { type: string, format: date-time }
 *               MaxParticipants: { type: integer }
 *               MaxRegistrationsPerPlayer: { type: integer }
 *               EntryFee: { type: number }
 *               OrganizerName: { type: string }
 *               ContactName: { type: string }
 *               ContactMobile: { type: string }
 *               ContactEmail: { type: string }
 *               banner: { type: string, format: binary }
 *               organizerLogo: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Tournament created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', upload.any(), tournamentController.createTournament);

/**
 * @swagger
 * /admin/tournaments:
 *   get:
 *     summary: Get all tournaments
 *     tags: [Admin Tournaments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tournaments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tournament'
 */
router.get('/', tournamentController.getTournaments);

/**
 * @swagger
 * /admin/tournaments/{id}:
 *   get:
 *     summary: Get tournament details
 *     tags: [Admin Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tournament details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tournament'
 *       404:
 *         description: Tournament not found
 */
router.get('/:id', tournamentController.getTournamentDetails);

/**
 * @swagger
 * /admin/tournaments/{id}:
 *   put:
 *     summary: Update a tournament
 *     tags: [Admin Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               Name: { type: string }
 *               Description: { type: string }
 *               SportId: { type: integer }
 *               ArenaId: { type: integer, nullable: true }
 *               Venue: { type: string }
 *               StartDate: { type: string, format: date-time }
 *               EndDate: { type: string, format: date-time }
 *               RegistrationStartDate: { type: string, format: date-time }
 *               RegistrationEndDate: { type: string, format: date-time }
 *               MaxParticipants: { type: integer }
 *               MaxRegistrationsPerPlayer: { type: integer }
 *               EntryFee: { type: number }
 *               OrganizerName: { type: string }
 *               ContactName: { type: string }
 *               ContactMobile: { type: string }
 *               ContactEmail: { type: string }
 *               banner: { type: string, format: binary }
 *               organizerLogo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Tournament updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Tournament not found
 */
router.put('/:id', upload.any(), tournamentController.updateTournament);

/**
 * @swagger
 * /admin/tournaments/{id}/registrations:
 *   get:
 *     summary: Get all registrations for a tournament
 *     tags: [Admin Tournaments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of registrations with participants
 */
router.get('/:id/registrations', tournamentController.getTournamentRegistrations);

module.exports = router;
