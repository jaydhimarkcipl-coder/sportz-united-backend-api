const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const superArenaController = require('../../controllers/super-admin/arena.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'arena-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Strictly Super Admin only
router.use(verifyToken);
router.use(allowRoles('super_admin'));

const arenaSchema = Joi.object({
    name: Joi.string().required(),
    ownerUserId: Joi.number().optional(),
    logoUrl: Joi.string().uri().allow(null, ''),
    addressLine1: Joi.string().allow(null, ''),
    addressLine2: Joi.string().allow(null, ''),
    city: Joi.string().required(),
    state: Joi.string().allow(null, ''),
    pinCode: Joi.string().allow(null, ''),
    phone: Joi.string().allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    latitude: Joi.number().allow(null),
    longitude: Joi.number().allow(null),
    openTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
    closeTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
    logo: Joi.any().optional(),
    sportIds: Joi.alternatives().try(
        Joi.array().items(Joi.number()),
        Joi.string() // To support comma-separated or JSON string from multipart
    ).optional()
});

const updateArenaSchema = Joi.object({
    name: Joi.string(),
    logoUrl: Joi.string().uri().allow(null, ''),
    addressLine1: Joi.string().allow(null, ''),
    addressLine2: Joi.string().allow(null, ''),
    city: Joi.string(),
    state: Joi.string().allow(null, ''),
    pinCode: Joi.string().allow(null, ''),
    phone: Joi.string().allow(null, ''),
    email: Joi.string().email().allow(null, ''),
    latitude: Joi.number().allow(null),
    longitude: Joi.number().allow(null),
    openTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
    closeTime: Joi.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/).allow(null, ''),
    isActive: Joi.boolean(),
    isApproved: Joi.boolean(),
    approvalStatus: Joi.string().valid('Pending', 'Approved', 'Rejected'),
    ownerUserId: Joi.number().optional(),
    logo: Joi.any().optional(),
    sportIds: Joi.alternatives().try(
        Joi.array().items(Joi.number()),
        Joi.string()
    ).optional()
});

const reviewSchema = Joi.object({
    isApproved: Joi.boolean().required(),
    approvalStatus: Joi.string().valid('Approved', 'Rejected').required()
});

/**
 * @swagger
 * /super-admin/arenas:
 *   post:
 *     summary: Create a new Arena (Super Admin)
 */
router.post('/', upload.single('logo'), validate(arenaSchema), superArenaController.create);

/**
 * @swagger
 * /super-admin/arenas:
 *   get:
 *     summary: Get all Arenas globally (Super Admin)
 */
router.get('/', superArenaController.getAll);

const idParamSchema = Joi.object({
    id: Joi.number().required()
});

/**
 * @swagger
 * /super-admin/arenas/{id}:
 *   get:
 *     summary: Get an Arena by ID
 */
router.get('/:id', validate(idParamSchema, 'params'), superArenaController.getById);

/**
 * @swagger
 * /super-admin/arenas/{id}:
 *   patch:
 *     summary: Update an Arena (Super Admin)
 */
router.patch('/:id', upload.single('logo'), validate(updateArenaSchema), superArenaController.update);

/**
 * @swagger
 * /super-admin/arenas/{id}/review:
 *   patch:
 *     summary: Approve or Reject an Arena (Super Admin)
 *     tags: [Super Admin Arenas]
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
 *             required: [isApproved, approvalStatus]
 *             properties:
 *               isApproved: { type: boolean }
 *               approvalStatus: { type: string, enum: [Approved, Rejected] }
 *     responses:
 *       200:
 *         description: Review status updated
 */
router.patch('/:id/review', validate(idParamSchema, 'params'), validate(reviewSchema), superArenaController.review);

/**
 * @swagger
 * /super-admin/arenas/{id}:
 *   delete:
 *     summary: Delete/Deactivate an Arena (Super Admin)
 */
router.delete('/:id', superArenaController.delete);

module.exports = router;
