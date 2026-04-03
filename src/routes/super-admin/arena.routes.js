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
    logo: Joi.any().optional()
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
    ownerUserId: Joi.number().optional(),
    logo: Joi.any().optional()
});

/**
 * @swagger
 * /super-admin/arenas:
 *   post:
 *     summary: Create a new Arena (Super Admin)
 *     tags: [Super Admin Arenas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, city]
 *             properties:
 *               name: { type: string }
 *               ownerUserId: { type: integer }
 *               logo: { type: string, format: binary }
 *               addressLine1: { type: string }
 *               addressLine2: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               pinCode: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               openTime: { type: string, example: "06:00" }
 *               closeTime: { type: string, example: "22:00" }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', upload.single('logo'), validate(arenaSchema), superArenaController.create);

/**
 * @swagger
 * /super-admin/arenas:
 *   get:
 *     summary: Get all Arenas globally (Super Admin)
 *     tags: [Super Admin Arenas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
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
 *     tags: [Super Admin Arenas]
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
router.get('/:id', validate(idParamSchema, 'params'), superArenaController.getById);

/**
 * @swagger
 * /super-admin/arenas/{id}:
 *   patch:
 *     summary: Update an Arena (Super Admin)
 *     tags: [Super Admin Arenas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               ownerUserId: { type: integer }
 *               logo: { type: string, format: binary }
 *               addressLine1: { type: string }
 *               addressLine2: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               pinCode: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               openTime: { type: string, example: "06:00" }
 *               closeTime: { type: string, example: "22:00" }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/:id', upload.single('logo'), validate(updateArenaSchema), superArenaController.update);

/**
 * @swagger
 * /super-admin/arenas/{id}:
 *   delete:
 *     summary: Delete/Deactivate an Arena (Super Admin)
 *     tags: [Super Admin Arenas]
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
router.delete('/:id', superArenaController.delete);

module.exports = router;
