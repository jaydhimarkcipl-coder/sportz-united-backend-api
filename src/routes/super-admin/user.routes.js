const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const superUserController = require('../../controllers/super-admin/user.controller');
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
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Strictly Super Admin only
router.use(verifyToken);
router.use(allowRoles('super_admin'));

const createUserSchema = Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    userType: Joi.string().valid('Admin', 'Player', 'Staff', 'super_admin').required(),
    roleId: Joi.number().optional(),
    arenaId: Joi.number().optional(),
    isActive: Joi.boolean().optional(),
    phone: Joi.string().optional(),
    city: Joi.string().optional(),
    address: Joi.string().optional(),
    gender: Joi.string().optional(),
    dateOfBirth: Joi.date().optional(),
    image: Joi.any().optional()
});

const updateUserSchema = Joi.object({
    fullName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    userType: Joi.string().valid('Admin', 'Player', 'Staff', 'super_admin'),
    roleId: Joi.number(),
    arenaId: Joi.number().allow(null),
    isActive: Joi.boolean(),
    isVerified: Joi.boolean(),
    phone: Joi.string(),
    city: Joi.string(),
    address: Joi.string(),
    gender: Joi.string(),
    dateOfBirth: Joi.date(),
    image: Joi.any().optional()
});

const idParamSchema = Joi.object({
    id: Joi.number().required()
});

/**
 * @swagger
 * /super-admin/users:
 *   post:
 *     summary: Create a new User (Super Admin)
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, userType]
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               userType: { type: string, enum: [Admin, Player, Staff, super_admin] }
 *               roleId: { type: integer }
 *               arenaId: { type: integer }
 *               phone: { type: string }
 *               city: { type: string }
 *               address: { type: string }
 *               gender: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', upload.single('image'), validate(createUserSchema), superUserController.create);

/**
 * @swagger
 * /super-admin/users:
 *   get:
 *     summary: Get all Users (Super Admin)
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema: { type: string, enum: [Admin, Player, Staff, super_admin] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', superUserController.getAll);

/**
 * @swagger
 * /super-admin/users/{id}:
 *   get:
 *     summary: Get a User by ID (Super Admin)
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: userType
 *         schema: { type: string, enum: [Admin, Player, Staff, super_admin] }
 *         description: Defaults to User. Pass Player to query tblPlayer.
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', validate(idParamSchema, 'params'), superUserController.getById);

/**
 * @swagger
 * /super-admin/users/{id}:
 *   patch:
 *     summary: Update a User (Super Admin)
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: userType
 *         schema: { type: string, enum: [Admin, Player, Staff, super_admin] }
 *         description: Defaults to User. Pass Player to query tblPlayer.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               userType: { type: string, enum: [Admin, Player, Staff] }
 *               roleId: { type: integer }
 *               arenaId: { type: integer }
 *               isActive: { type: boolean }
 *               isVerified: { type: boolean }
 *               phone: { type: string }
 *               city: { type: string }
 *               address: { type: string }
 *               gender: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch('/:id', upload.single('image'), validate(updateUserSchema), superUserController.update);

/**
 * @swagger
 * /super-admin/users/{id}:
 *   delete:
 *     summary: Deactivate a User (Super Admin)
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: userType
 *         schema: { type: string, enum: [Admin, Player, Staff, super_admin] }
 *         description: Defaults to User. Pass Player to query tblPlayer.
 *     responses:
 *       200:
 *         description: Deactivated
 */
router.delete('/:id', superUserController.delete);

module.exports = router;
