const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const amenityController = require('../../controllers/super-admin/amenity.controller');

// Strictly Super Admin only
router.use(verifyToken);
router.use(allowRoles('super_admin'));

const amenitySchema = Joi.object({
    name: Joi.string().required(),
    isActive: Joi.boolean().default(true)
});

const updateAmenitySchema = Joi.object({
    name: Joi.string(),
    isActive: Joi.boolean()
});

/**
 * @swagger
 * /super-admin/amenities:
 *   post:
 *     summary: Create a new global Amenity (Super Admin)
 *     tags: [Super Admin Amenities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', validate(amenitySchema), amenityController.create);

/**
 * @swagger
 * /super-admin/amenities:
 *   get:
 *     summary: Get all global Amenities (Super Admin)
 *     tags: [Super Admin Amenities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', amenityController.getAll);

const idParamSchema = Joi.object({
    id: Joi.number().required()
});

/**
 * @swagger
 * /super-admin/amenities/{id}:
 *   get:
 *     summary: Get Amenity details
 *     tags: [Super Admin Amenities]
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
router.get('/:id', validate(idParamSchema, 'params'), amenityController.getById);

/**
 * @swagger
 * /super-admin/amenities/{id}:
 *   put:
 *     summary: Update an Amenity (Super Admin)
 *     tags: [Super Admin Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', validate(idParamSchema, 'params'), validate(updateAmenitySchema), amenityController.update);

/**
 * @swagger
 * /super-admin/amenities/{id}:
 *   delete:
 *     summary: Delete an Amenity (Super Admin)
 *     tags: [Super Admin Amenities]
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
router.delete('/:id', validate(idParamSchema, 'params'), amenityController.delete);

module.exports = router;
