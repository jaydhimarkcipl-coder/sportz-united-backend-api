const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const arenaAmenityController = require('../../controllers/admin/arena-amenity.controller');

// Admin and Super Admin access
router.use(verifyToken);
router.use(allowRoles('admin', 'super_admin'));

const arenaIdParamSchema = Joi.object({
    arenaId: Joi.number().required()
});

const arenaAmenityParamSchema = Joi.object({
    arenaId: Joi.number().required(),
    amenityId: Joi.number().required()
});

const addAmenitySchema = Joi.object({
    amenityId: Joi.number().required()
});

/**
 * @swagger
 * /admin/arenas/{arenaId}/amenities:
 *   post:
 *     summary: Link a global amenity to an arena (Arena Admin)
 *     tags: [Admin Arena Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amenityId]
 *             properties:
 *               amenityId: { type: integer }
 *     responses:
 *       201:
 *         description: Linked
 */
router.post('/:arenaId/amenities', 
    validate(arenaIdParamSchema, 'params'), 
    requireArenaOwnership, 
    validate(addAmenitySchema), 
    arenaAmenityController.add
);

/**
 * @swagger
 * /admin/arenas/{arenaId}/amenities:
 *   get:
 *     summary: Get all amenities linked to an arena
 *     tags: [Admin Arena Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:arenaId/amenities', 
    validate(arenaIdParamSchema, 'params'), 
    requireArenaOwnership, 
    arenaAmenityController.getArenaAmenities
);

/**
 * @swagger
 * /admin/arenas/{arenaId}/amenities/{amenityId}:
 *   delete:
 *     summary: Unlink an amenity from an arena
 *     tags: [Admin Arena Amenities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: arenaId
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: amenityId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Unlinked
 */
router.delete('/:arenaId/amenities/:amenityId', 
    validate(arenaAmenityParamSchema, 'params'), 
    requireArenaOwnership, 
    arenaAmenityController.remove
);

module.exports = router;
