const express = require('express');
const router = express.Router();
const sportController = require('../../controllers/user/sport.controller');

/**
 * @swagger
 * tags:
 *   name: Sports
 *   description: Sports listing for players
 */

/**
 * @swagger
 * /sports:
 *   get:
 *     summary: Get all active sports
 *     tags: [Sports]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', sportController.getAll);

module.exports = router;
