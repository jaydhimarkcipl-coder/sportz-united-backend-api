const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminMemController = require('../../controllers/admin/membership.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const planSchema = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().required(),
    durationDays: Joi.number().required(),
    benefits: Joi.array().items(Joi.string()),
    arenaId: Joi.number()
});

const assignSchema = Joi.object({
    playerId: Joi.number().required(),
    planId: Joi.string().required()
});

/**
 * @swagger
 * /admin/memberships:
 *   post:
 *     summary: Create a membership plan
 *     tags: [Admin Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, durationDays]
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               durationDays: { type: integer }
 *               benefits: { type: array, items: { type: string } }
 *               arenaId: { type: integer }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', validate(planSchema), adminMemController.createPlan);

/**
 * @swagger
 * /admin/memberships:
 *   get:
 *     summary: Get all membership plans
 *     tags: [Admin Memberships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminMemController.getPlans);

/**
 * @swagger
 * /admin/memberships/assign:
 *   post:
 *     summary: Assign a membership to a player
 *     tags: [Admin Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [playerId, planId]
 *             properties:
 *               playerId: { type: integer }
 *               planId: { type: string }
 *     responses:
 *       200:
 *         description: Assigned
 */
router.post('/assign', validate(assignSchema), adminMemController.assign);

module.exports = router;
