const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { verifyToken } = require('../../middlewares/auth.middleware');
const allowRoles = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const superSportController = require('../../controllers/super-admin/sport.controller');
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
        cb(null, 'sport-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Strictly Super Admin only
router.use(verifyToken);
router.use(allowRoles('super_admin'));

const sportSchema = Joi.object({
    name: Joi.string().required(),
    sportType: Joi.string().required(), // Indoor, Outdoor
    noOfPerson: Joi.number().integer().required(),
    image: Joi.any().optional()
});

const updateSportSchema = Joi.object({
    name: Joi.string(),
    sportType: Joi.string(),
    noOfPerson: Joi.number().integer(),
    isActive: Joi.boolean(),
    image: Joi.any().optional()
});

/**
 * @swagger
 * /super-admin/sports:
 *   post:
 *     summary: Create a new Sport category (Super Admin)
 *     tags: [Super Admin Sports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, sportType, noOfPerson]
 *             properties:
 *               name: { type: string }
 *               sportType: { type: string }
 *               noOfPerson: { type: integer }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', upload.single('image'), validate(sportSchema), superSportController.create);

/**
 * @swagger
 * /super-admin/sports:
 *   get:
 *     summary: Get all Sports categories (Super Admin)
 *     tags: [Super Admin Sports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', superSportController.getAll);

const idParamSchema = Joi.object({
    id: Joi.number().required()
});

/**
 * @swagger
 * /super-admin/sports/{id}:
 *   get:
 *     summary: Get a Sport category by ID
 *     tags: [Super Admin Sports]
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
router.get('/:id', validate(idParamSchema, 'params'), superSportController.getById);

/**
 * @swagger
 * /super-admin/sports/{id}:
 *   put:
 *     summary: Update a Sport category (Super Admin)
 *     tags: [Super Admin Sports]
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
 *               sportType: { type: string }
 *               noOfPerson: { type: integer }
 *               isActive: { type: boolean }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Updated
 */
router.put('/:id', upload.single('image'), validate(updateSportSchema), superSportController.update);

/**
 * @swagger
 * /super-admin/sports/{id}:
 *   delete:
 *     summary: Delete a Sport category (Super Admin)
 *     tags: [Super Admin Sports]
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
router.delete('/:id', superSportController.delete);

module.exports = router;
