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

module.exports = router;
