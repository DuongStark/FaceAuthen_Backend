import express from 'express';
import { startSession, endSession, getActiveSession } from '../controllers/sessions.controller';
import { requireAuth, requireLecturer } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /sessions/start:
 *   post:
 *     summary: Start a new session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *             properties:
 *               classId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session started successfully
 *       400:
 *         description: Validation error or active session exists
 */
router.post('/start', requireAuth, requireLecturer, startSession);

/**
 * @swagger
 * /sessions/{id}/end:
 *   post:
 *     summary: End a session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended successfully
 */
router.post('/:id/end', requireAuth, requireLecturer, endSession);

/**
 * @swagger
 * /sessions/active/{classId}:
 *   get:
 *     summary: Get active session for a class
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active session
 *       404:
 *         description: No active session found
 */
router.get('/active/:classId', getActiveSession);

export default router;
