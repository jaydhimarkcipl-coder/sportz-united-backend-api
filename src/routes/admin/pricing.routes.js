const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminPricingController = require('../../controllers/admin/pricing.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const pricingSchema = Joi.object({
    courtId: Joi.number().required(),
    basePrice: Joi.number().required(),
    finalPrice: Joi.number().required(),
    dayName: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)?$/), // e.g. 14:00:00
    endTime: Joi.string(),
    isWeekend: Joi.boolean()
});

/**
 * @swagger
 * /admin/pricing:
 *   post:
 *     summary: Set pricing rules for slots
 *     tags: [Admin Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courtId, basePrice, finalPrice]
 *             properties:
 *               courtId: { type: integer }
 *               basePrice: { type: number }
 *               finalPrice: { type: number }
 *               dayName: { type: string }
 *               startTime: { type: string, example: "14:00:00" }
 *               isWeekend: { type: boolean }
 *     responses:
 *       200:
 *         description: Pricing Set
 */
router.post('/', validate(pricingSchema), adminPricingController.setPricing);

/**
 * @swagger
 * /admin/pricing:
 *   get:
 *     summary: Get pricing for slots
 *     tags: [Admin Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courtId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminPricingController.getPricing);

module.exports = router;
