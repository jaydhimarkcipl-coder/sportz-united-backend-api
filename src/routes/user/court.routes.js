const express = require('express');
const router = express.Router();
const { getCourts, getSlots, blockSlot, unblockSlot } = require('../../controllers/user/court.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

/**
 * @swagger
 * /courts/{arenaId}:
 *   get:
 *     summary: Get courts by arena ID
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of courts
 */
router.get('/:arenaId', verifyToken, getCourts);

/**
 * @swagger
 * /courts/slots/query:
 *   get:
 *     summary: Get slots for a court on a specific date
 *     tags: [Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courtId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of slots
 */
router.get('/slots/query', verifyToken, getSlots);

module.exports = router;
