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
 *                 example: session-uuid-abc
 *               studentId:
 *                 type: string
 *                 example: B21DCCN001
 *               method:
 *                 type: string
 *                 enum: [face, manual]
 *                 example: face
 *               matchedAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T14:35:20.000Z"
 *     responses:
 *       201:
 *         description: Attendance recorded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Attendance recorded successfully
 *               id: attendance-uuid-xyz
 *               attendance:
 *                 id: attendance-uuid-xyz
 *                 studentId: B21DCCN001
 *                 studentName: Nguyễn Văn An
 *                 method: face
 *                 matchedAt: "2024-01-15T14:35:20.000Z"
 *       400:
 *         description: Validation error or duplicate attendance
 *         content:
 *           application/json:
 *             example:
 *               error: Duplicate attendance detected
 *               message: Attendance was recorded 45 seconds ago. Please wait at least 120 seconds.
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
 *         example: session-uuid-abc
 *     responses:
 *       200:
 *         description: List of attendance
 *         content:
 *           application/json:
 *             example:
 *               - id: attendance-uuid-1
 *                 studentId: B21DCCN001
 *                 studentName: Nguyễn Văn An
 *                 method: face
 *                 matchedAt: "2024-01-15T14:35:20.000Z"
 *               - id: attendance-uuid-2
 *                 studentId: B21DCCN002
 *                 studentName: Trần Thị Bình
 *                 method: manual
 *                 matchedAt: "2024-01-15T14:36:10.000Z"
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
