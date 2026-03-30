const express = require('express');
const router = express.Router();
const amenityController = require('../../controllers/super-admin/amenity.controller');

/**
 * @swagger
 * /amenities:
 *   get:
 *     summary: Get all global Amenities (Public)
 *     tags: [Amenities]
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       AmenityId: { type: integer }
 *                       Name: { type: string }
 *                       IsActive: { type: boolean }
 */
router.get('/', amenityController.getAll);

module.exports = router;
