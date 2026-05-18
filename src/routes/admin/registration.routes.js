const express = require('express');
const router = express.Router();
const registrationController = require('../../controllers/admin/registration.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// Protect all admin routes
router.use(verifyToken);
router.use((req, res, next) => {
    if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin' || req.user.type === 'Admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied' });
});

/**
 * @swagger
 * /admin/registrations/export:
 *   get:
 *     summary: Export all registrations to Excel
 *     tags: [Admin Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Excel file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/export', registrationController.exportRegistrations);

module.exports = router;
