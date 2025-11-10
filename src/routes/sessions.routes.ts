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
 *                 example: class-uuid-123
 *     responses:
 *       201:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Session started successfully
 *               id: session-uuid-abc
 *               startAt: "2024-01-15T14:30:00.000Z"
 *       400:
 *         description: Validation error or active session exists
 *         content:
 *           application/json:
 *             example:
 *               error: There is already an active session for this class
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
 *         example: class-uuid-123
 *     responses:
 *       200:
 *         description: Active session
 *         content:
 *           application/json:
 *             example:
 *               id: session-uuid-abc
 *               classId: class-uuid-123
 *               createdBy: lecturer-uuid
 *               startAt: "2024-01-15T14:30:00.000Z"
 *               endAt: null
 *               createdAt: "2024-01-15T14:30:00.000Z"
 *       404:
 *         description: No active session found
 *         content:
 *           application/json:
 *             example:
 *               error: No active session found
 */
router.get('/active/:classId', getActiveSession);

export default router;
