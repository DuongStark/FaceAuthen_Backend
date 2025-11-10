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
 *                 example: B21DCCN001
 *               descriptor:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [0.123, -0.456, 0.789]
 *     responses:
 *       201:
 *         description: Face descriptor uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Face descriptor uploaded successfully
 *               id: face-descriptor-uuid-xyz
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               error: Descriptor must be an array
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             example:
 *               error: Student not found
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
 *         example: class-uuid-123
 *     responses:
 *       200:
 *         description: Face gallery
 *         content:
 *           application/json:
 *             example:
 *               - studentId: B21DCCN001
 *                 descriptors:
 *                   - [0.123, -0.456, 0.789, ...]
 *                   - [0.234, -0.567, 0.890, ...]
 *               - studentId: B21DCCN002
 *                 descriptors:
 *                   - [0.345, -0.678, 0.901, ...]
 */
router.get('/gallery/:classId', fetchFaceGallery);

export default router;
