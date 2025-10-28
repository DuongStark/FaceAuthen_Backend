import express from 'express';
import { recordAttendance, listAttendance, subscribeAttendance } from '../controllers/attendance.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /attendance/record:
 *   post:
 *     summary: Record attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - studentId
 *               - method
 *             properties:
 *               sessionId:
 *                 type: string
 *               studentId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [face, manual]
 *               matchedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Attendance recorded successfully
 *       400:
 *         description: Validation error or duplicate attendance
 */
router.post('/record', requireAuth, recordAttendance);

/**
 * @swagger
 * /attendance/{sessionId}:
 *   get:
 *     summary: List attendance for a session
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of attendance
 */
router.get('/:sessionId', listAttendance);

/**
 * @swagger
 * /attendance/{sessionId}/subscribe:
 *   get:
 *     summary: Subscribe to attendance updates (SSE)
 *     tags: [Attendance]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SSE connection
 */
router.get('/:sessionId/subscribe', subscribeAttendance);

export default router;
