const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminPlayerController = require('../../controllers/admin/player.controller');

// All routes require authentication, proper roles, and arena ownership context
router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

/**
 * @swagger
 * /admin/players:
 *   get:
 *     summary: View unique players who have interacted with the admin's arenas
 *     tags: [Admin Players]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminPlayerController.getPlayers);

/**
 * @swagger
 * /admin/players/all:
 *   get:
 *     summary: Search all players in the system
 *     tags: [Admin Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/all', adminPlayerController.getAllUsers);

/**
 * @swagger
 * /admin/players/check/{phone}:
 *   get:
 *     summary: Check if a player exists by mobile number and return details
 *     tags: [Admin Players]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phone
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/check/:phone', adminPlayerController.checkPlayerByPhone);

module.exports = router;
