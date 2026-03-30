const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminSlotController = require('../../controllers/admin/slot.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const blockSchema = Joi.object({
    slotId: Joi.number(),
    courtId: Joi.number(),
    dayName: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
}).or('slotId', 'courtId'); // Ensure at least one blocking method is provided

const unblockSchema = Joi.object({
    slotId: Joi.number().required()
});

/**
 * @swagger
 * /admin/slots/block:
 *   post:
 *     summary: Block a specific slot or a full day for a court
 *     tags: [Admin Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotId: { type: integer }
 *               courtId: { type: integer, description: "Required if blocking full day" }
 *               dayName: { type: string, description: "Required if blocking full day by courtId" }
 *     responses:
 *       200:
 *         description: Blocked
 */
router.post('/block', validate(blockSchema), adminSlotController.block);

/**
 * @swagger
 * /admin/slots/unblock:
 *   post:
 *     summary: Unblock a specific slot
 *     tags: [Admin Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slotId]
 *             properties:
 *               slotId: { type: integer }
 *     responses:
 *       200:
 *         description: Unblocked
 */
router.post('/unblock', validate(unblockSchema), adminSlotController.unblock);

/**
 * @swagger
 * /admin/slots/generate:
 *   post:
 *     summary: Bulk generate slots for a court (7 days)
 *     tags: [Admin Slots]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courtId, startTime, endTime, basePrice]
 *             properties:
 *               courtId: { type: integer }
 *               startTime: { type: string, example: "06:00" }
 *               endTime: { type: string, example: "22:00" }
 *               slotDuration: { type: integer, default: 60 }
 *               basePrice: { type: number }
 *               weekendPrice: { type: number }
 *     responses:
 *       201:
 *         description: Slots generated
 */
router.post('/generate', adminSlotController.generate);

/**
 * @swagger
 * /admin/slots:
 *   get:
 *     summary: List slots with filters
 *     tags: [Admin Slots]
 *     parameters:
 *       - in: query
 *         name: courtId
 *         schema: { type: integer }
 *       - in: query
 *         name: dayName
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of slots
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 */
router.get('/', adminSlotController.getAll);

const deleteSchema = Joi.object({
    courtId: Joi.number().required()
});

/**
 * @swagger
 * /admin/slots/court/{courtId}:
 *   delete:
 *     summary: Delete all slots for a court
 *     tags: [Admin Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courtId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Slots deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 count: { type: integer }
 */
router.delete('/court/:courtId', validate(deleteSchema, 'params'), adminSlotController.deleteAll);

module.exports = router;
