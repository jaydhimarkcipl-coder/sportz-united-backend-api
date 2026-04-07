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
}).or('slotId', 'courtId');

const unblockSchema = Joi.object({
    slotId: Joi.number().required()
});

const slotItemSchema = Joi.object({
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    basePrice: Joi.number().required(),
    isActive: Joi.boolean().default(true)
});

const dayScheduleSchema = Joi.object({
    dayName: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
    isActive: Joi.boolean().default(true),
    slots: Joi.array().items(slotItemSchema).required()
});

const syncSchema = Joi.object({
    courtId: Joi.number().required(),
    slotDurationMin: Joi.number(),
    days: Joi.array().items(dayScheduleSchema).required()
});

/**
 * @swagger
 * /admin/slots/block:
 *   post:
 *     summary: Block a specific slot or a full day for a court
 */
router.post('/block', validate(blockSchema), adminSlotController.block);

/**
 * @swagger
 * /admin/slots/unblock:
 *   post:
 *     summary: Unblock a specific slot
 */
router.post('/unblock', validate(unblockSchema), adminSlotController.unblock);

/**
 * @swagger
 * /admin/slots/sync:
 *   post:
 *     summary: Synchronize weekly slots for a court (Replace old generate logic)
 *     tags: [Admin Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courtId, days]
 *             properties:
 *               courtId: { type: integer }
 *               slotDurationMin: { type: integer, default: 60 }
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     dayName: { type: string, example: "Monday" }
 *                     isActive: { type: boolean }
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           startTime: { type: string, example: "07:30" }
 *                           endTime: { type: string, example: "08:30" }
 *                           basePrice: { type: number }
 *                           isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Slots synchronized
 */
router.post('/sync', validate(syncSchema), adminSlotController.sync);

/**
 * @swagger
 * /admin/slots/court/{courtId}:
 *   get:
 *     summary: Get weekly slot configuration for a court (for UI toggles)
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
 *         description: Weekly configuration
 */
router.get('/court/:courtId', adminSlotController.getSlotsByCourt);

/**
 * @swagger
 * /admin/slots:
 *   get:
 *     summary: List all raw slots with filters
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
 */
router.delete('/court/:courtId', validate(deleteSchema, 'params'), adminSlotController.deleteAll);

module.exports = router;
