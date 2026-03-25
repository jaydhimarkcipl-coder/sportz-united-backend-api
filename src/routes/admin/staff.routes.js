const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminStaffController = require('../../controllers/admin/staff.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
// Super admins and arena owners can create sub-staff
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const staffSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('receptionist', 'cashier', 'coach', 'arena_owner').required(),
    arenaId: Joi.number().optional() // Optional for Super Admin, required or auto-filled for owners
});

const updateSchema = Joi.object({
    fullName: Joi.string(),
    email: Joi.string().email(),
    role: Joi.string().valid('receptionist', 'cashier', 'coach', 'arena_owner'),
    isActive: Joi.boolean()
});

const idParamSchema = Joi.object({
    id: Joi.number().required()
});

/**
 * @swagger
 * /admin/staff:
 *   post:
 *     summary: Create new staff member
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, role]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [receptionist, cashier, coach, arena_owner] }
 *     responses:
 *       201:
 *         description: Staff created
 */
router.post('/', validate(staffSchema), adminStaffController.create);

/**
 * @swagger
 * /admin/staff:
 *   get:
 *     summary: Get all staff created by you
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminStaffController.getAll);

/**
 * @swagger
 * /admin/staff/{id}:
 *   get:
 *     summary: Get specific staff member by ID
 *     tags: [Admin Staff]
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
 *       404:
 *         description: Not found
 */
router.get('/:id', validate(idParamSchema, 'params'), adminStaffController.getById);

/**
 * @swagger
 * /admin/staff/{id}:
 *   put:
 *     summary: Update staff member
 *     tags: [Admin Staff]
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
 *           schema: { type: object, properties: { fullName: { type: string }, email: { type: string }, role: { type: string }, isActive: { type: boolean } } }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', validate(idParamSchema, 'params'), validate(updateSchema), adminStaffController.update);

/**
 * @swagger
 * /admin/staff/{id}:
 *   delete:
 *     summary: Deactivate staff member
 *     tags: [Admin Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deactivated
 */
router.delete('/:id', validate(idParamSchema, 'params'), adminStaffController.delete);

module.exports = router;
