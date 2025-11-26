import express from 'express';
import { startSession, endSession, getActiveSession, getMySessions } from '../controllers/sessions.controller';
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
 *               scheduleSessionId:
 *                 type: string
 *                 example: schedule-session-uuid-456
 *                 description: Optional - ID của buổi học trong lịch. Nếu có thì session sẽ được link với buổi học đó.
 *     responses:
 *       201:
 *         description: Session started successfully
 *         content:
 *           application/json:
 *             examples:
 *               withScheduleSession:
 *                 summary: Session with schedule
 *                 value:
 *                   message: Session started successfully
 *                   session:
 *                     id: session-uuid-abc
 *                     classId: class-uuid-123
 *                     scheduleSessionId: schedule-session-uuid-456
 *                     startAt: "2024-01-15T14:30:00.000Z"
 *                     class:
 *                       id: class-uuid-123
 *                       name: Lập Trình Cơ Bản
 *                       code: IT101
 *                     scheduleSession:
 *                       id: schedule-session-uuid-456
 *                       sessionName: Buổi 5
 *                       sessionDate: "2024-01-15T00:00:00.000Z"
 *               withoutScheduleSession:
 *                 summary: Session without schedule
 *                 value:
 *                   message: Session started successfully
 *                   session:
 *                     id: session-uuid-abc
 *                     classId: class-uuid-123
 *                     scheduleSessionId: null
 *                     startAt: "2024-01-15T14:30:00.000Z"
 *                     class:
 *                       id: class-uuid-123
 *                       name: Lập Trình Cơ Bản
 *                       code: IT101
 *       400:
 *         description: Validation error or active session exists
 *         content:
 *           application/json:
 *             examples:
 *               activeSessionExists:
 *                 value:
 *                   error: There is already an active session for this class
 *               sessionAlreadyLinked:
 *                 value:
 *                   error: This schedule session already has an attendance session
 *                   existingSessionId: session-uuid-xyz
 *       404:
 *         description: Schedule session not found
 *         content:
 *           application/json:
 *             example:
 *               error: Schedule session not found
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

/**
 * @swagger
 * /sessions/my-sessions:
 *   get:
 *     summary: Get all sessions for current user (lecturer or student)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns all sessions related to the current user:
 *       - **Lecturer/Admin**: Returns sessions from all classes they teach
 *       - **Student**: Returns sessions from all classes they belong to
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             examples:
 *               lecturerSessions:
 *                 summary: Lecturer's sessions
 *                 value:
 *                   - id: session-uuid-1
 *                     classId: class-uuid-123
 *                     className: Lập Trình Cơ Bản
 *                     classCode: IT101
 *                     lecturerName: Giảng Viên Nguyễn Văn A
 *                     scheduleSessionId: schedule-session-uuid-456
 *                     scheduleSession:
 *                       id: schedule-session-uuid-456
 *                       sessionName: Buổi 5
 *                       sessionDate: "2024-01-15T00:00:00.000Z"
 *                       status: COMPLETED
 *                     startAt: "2024-01-15T07:00:00.000Z"
 *                     endAt: "2024-01-15T09:00:00.000Z"
 *                     isActive: false
 *                     totalAttendances: 38
 *                     createdBy: lecturer-uuid-abc
 *                     createdAt: "2024-01-15T07:00:00.000Z"
 *                   - id: session-uuid-2
 *                     classId: class-uuid-123
 *                     className: Lập Trình Cơ Bản
 *                     classCode: IT101
 *                     lecturerName: Giảng Viên Nguyễn Văn A
 *                     scheduleSessionId: null
 *                     scheduleSession: null
 *                     startAt: "2024-01-10T07:00:00.000Z"
 *                     endAt: "2024-01-10T09:00:00.000Z"
 *                     isActive: false
 *                     totalAttendances: 35
 *                     createdBy: lecturer-uuid-abc
 *                     createdAt: "2024-01-10T07:00:00.000Z"
 *               studentSessions:
 *                 summary: Student's sessions
 *                 value:
 *                   - id: session-uuid-1
 *                     classId: class-uuid-123
 *                     className: Lập Trình Cơ Bản
 *                     classCode: IT101
 *                     lecturerName: Giảng Viên Nguyễn Văn A
 *                     scheduleSessionId: schedule-session-uuid-456
 *                     scheduleSession:
 *                       id: schedule-session-uuid-456
 *                       sessionName: Buổi 5
 *                       sessionDate: "2024-01-15T00:00:00.000Z"
 *                       status: COMPLETED
 *                     startAt: "2024-01-15T07:00:00.000Z"
 *                     endAt: "2024-01-15T09:00:00.000Z"
 *                     isActive: false
 *                     totalAttendances: 38
 *                     createdBy: lecturer-uuid-abc
 *                     createdAt: "2024-01-15T07:00:00.000Z"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               error: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               error: Internal server error
 */
router.get('/my-sessions', requireAuth, getMySessions);

export default router;
