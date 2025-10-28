import express from 'express';
import { uploadFace, fetchFaceGallery } from '../controllers/faces.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /faces/upload:
 *   post:
 *     summary: Upload face descriptor
 *     tags: [Faces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - descriptor
 *             properties:
 *               studentId:
 *                 type: string
 *               descriptor:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: Face descriptor uploaded successfully
 *       400:
 *         description: Validation error
 */
router.post('/upload', requireAuth, uploadFace);

/**
 * @swagger
 * /faces/gallery/{classId}:
 *   get:
 *     summary: Get face gallery for a class
 *     tags: [Faces]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Face gallery
 */
router.get('/gallery/:classId', fetchFaceGallery);

export default router;
