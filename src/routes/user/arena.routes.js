const express = require('express');
const { getArenas, getArenaDetails, getArenaCourts, searchArenas, getArenaSlots, getArenaSports } = require('../../controllers/user/arena.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const router = express.Router();

/**
 * @swagger
 * /arenas/search:
 *   get:
 *     summary: Search arenas by city, sport, or geo-location
 *     tags: [Arenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: sportId
 *         schema: { type: integer }
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *       - in: query
 *         name: minRating
 *         schema: { type: number, enum: [3.0, 4.0, 4.5] }
 *       - in: query
 *         name: priceRange
 *         schema: { type: string, enum: [under1000, 1000to1500, above1500] }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date, example: "2026-03-26" }
 *       - in: query
 *         name: availability
 *         schema: { type: string, enum: [morning, afternoon, evening] }
 *       - in: query
 *         name: maxDistance
 *         schema: { type: number, description: "Distance in km" }
 *       - in: query
 *         name: amenityIds
 *         schema: { type: array, items: { type: integer } }
 *     responses:
 *       200:
 *         description: Search results
 *  */
router.get('/search', searchArenas);

/**
 * @swagger
 * /arenas:
 *   get:
 *     summary: Get all active arenas
 *     tags: [Arenas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of arenas
 */
router.get('/', getArenas);

/**
 * @swagger
 * /arenas/{arenaId}:
 *   get:
 *     summary: Get arena details
 *     tags: [Arenas]
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
 *         description: Arena details
 */
router.get('/:arenaId', getArenaDetails);

/**
 * @swagger
 * /arenas/{arenaId}/courts:
 *   get:
 *     summary: Get all courts for a specific arena
 *     tags: [Arenas]
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
router.get('/:arenaId/courts', verifyToken, getArenaCourts);

/**
 * @swagger
 * /arenas/{arenaId}/sports:
 *   get:
 *     summary: Get all sports associated with a specific arena
 *     tags: [Arenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of sports
 */
router.get('/:arenaId/sports', getArenaSports);

/**
 * @swagger
 * /arenas/{arenaId}/reviews:
 *   get:
 *     summary: Get reviews for an arena
 *     tags: [Arenas]
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/:arenaId/reviews', (req, res) => res.json({ success: true, data: [] }));

/**
 * @swagger
 * /arenas/{arenaId}/slots:
 *   get:
 *     summary: Get all slots (available/booked) for all courts in an arena by date
 *     tags: [Arenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date, example: "2026-03-28" }
 *       - in: query
 *         name: sportId
 *         required: false
 *         schema: { type: integer }
 *       - in: query
 *         name: courtId
 *         required: false
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of courts and their slots with status
 */
router.get('/:arenaId/slots', getArenaSlots);

module.exports = router;
