const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const requireArenaOwnership = require('../../middlewares/arena.middleware');
const adminPromoController = require('../../controllers/admin/promo.controller');
const validate = require('../../middlewares/validate.middleware');

router.use(verifyToken);
router.use(allowRoles('super_admin', 'arena_owner'));
router.use(requireArenaOwnership);

const promoSchema = Joi.object({
    code: Joi.string().required(),
    discountType: Joi.string().valid('percentage', 'flat').required(),
    discountValue: Joi.number().required(),
    expiryDate: Joi.date().required(),
    usageLimit: Joi.number().integer().min(1),
    arenaId: Joi.number()
});

/**
 * @swagger
 * /admin/promos:
 *   post:
 *     summary: Create a promo code
 *     tags: [Admin Promos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue, expiryDate]
 *             properties:
 *               code: { type: string }
 *               discountType: { type: string, enum: [percentage, flat] }
 *               discountValue: { type: number }
 *               expiryDate: { type: string, format: date }
 *               usageLimit: { type: integer }
 *               arenaId: { type: integer }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', validate(promoSchema), adminPromoController.create);

/**
 * @swagger
 * /admin/promos:
 *   get:
 *     summary: Get all promo codes
 *     tags: [Admin Promos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', adminPromoController.getAll);

/**
 * @swagger
 * /admin/promos/{id}:
 *   get:
 *     summary: Get specific promo code
 *     tags: [Admin Promos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', adminPromoController.getById);

module.exports = router;
