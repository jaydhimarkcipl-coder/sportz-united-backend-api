const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const validate = require('../../middlewares/validate.middleware');
const adminCourtController = require('../../controllers/admin/court.controller');

router.use(verifyToken);
// Super admins and arena owners can both manage courts
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

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

const courtSchema = Joi.object({
    ArenaId: Joi.number().required(),
    SportId: Joi.number().required(),
    CourtName: Joi.string().required(),
    CategoryId: Joi.number(),
    SlotDurationMin: Joi.number().required(),
    Description: Joi.string(),
    slots: Joi.object({
        slotDurationMin: Joi.number(),
        days: Joi.array().items(dayScheduleSchema).required()
    }).optional()
});

const updateCourtSchema = Joi.object({
    CourtName: Joi.string(),
    CategoryId: Joi.number(),
    SlotDurationMin: Joi.number(),
    Description: Joi.string(),
    IsActive: Joi.boolean(),
    slots: Joi.object({
        slotDurationMin: Joi.number(),
        days: Joi.array().items(dayScheduleSchema).required()
    }).optional()
});

/**
 * @swagger
 * /admin/courts:
 *   post:
 *     summary: Add a new Court with optional weekly slots
 *     tags: [Admin Courts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ArenaId, SportId, CourtName, SlotDurationMin]
 *             properties:
 *               ArenaId: { type: integer }
 *               SportId: { type: integer }
 *               CourtName: { type: string }
 *               SlotDurationMin: { type: integer }
 *               Description: { type: string }
 *               slots:
 *                 type: object
 *                 properties:
 *                   slotDurationMin: { type: integer }
 *                   days:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         dayName: { type: string, example: "Monday" }
 *                         isActive: { type: boolean }
 *                         slots:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               startTime: { type: string, example: "08:30" }
 *                               endTime: { type: string, example: "09:30" }
 *                               basePrice: { type: number }
 *                               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', validate(courtSchema), adminCourtController.create);

/**
 * @swagger
 * /admin/courts:
 *   get:
 *     summary: Get all owned Courts
 *     tags: [Admin Courts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminCourtController.getAll);

const idParamSchema = Joi.object({
    id: Joi.number().required()
});

/**
 * @swagger
 * /admin/courts/{id}:
 *   get:
 *     summary: Get an owned Court by ID
 *     tags: [Admin Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', validate(idParamSchema, 'params'), adminCourtController.getById);

/**
 * @swagger
 * /admin/courts/{id}:
 *   put:
 *     summary: Update an owned Court and its slots
 *     tags: [Admin Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               CourtName: { type: string }
 *               IsActive: { type: boolean }
 *               Description: { type: string }
 *               slots:
 *                 type: object
 *                 properties:
 *                   slotDurationMin: { type: integer }
 *                   days:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         dayName: { type: string }
 *                         isActive: { type: boolean }
 *                         slots: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', validate(updateCourtSchema), adminCourtController.update);

/**
 * @swagger
 * /admin/courts/{id}:
 *   delete:
 *     summary: Delete/Deactivate an owned Court
 *     tags: [Admin Courts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', adminCourtController.delete);

module.exports = router;
