import express from 'express';
import {
  createSchedule,
  getSchedulesByClass,
  getScheduleSessions,
  updateScheduleSession,
  deleteSchedule,
  getMySchedules,
} from '../controllers/schedule.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /schedules/create:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
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
 *               - name
 *               - startDate
 *               - endDate
 *               - daysOfWeek
 *               - startTime
 *               - endTime
 *             properties:
 *               classId:
 *                 type: string
 *                 example: "abc-123-def-456"
 *               name:
 *                 type: string
 *                 example: "Học kỳ 1 2024-2025"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-15"
 *               daysOfWeek:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [1, 3, 5]
 *                 description: "Ngày học trong tuần: 0=Chủ Nhật, 1=Thứ Hai, 2=Thứ Ba, 3=Thứ Tư, 4=Thứ Năm, 5=Thứ Sáu, 6=Thứ Bảy. VD: [1,3,5] = Thứ 2,4,6"
 *               startTime:
 *                 type: string
 *                 example: "07:00"
 *               endTime:
 *                 type: string
 *                 example: "09:00"
 *               room:
 *                 type: string
 *                 example: "A101"
 *               description:
 *                 type: string
 *                 example: "Lớp Toán Cao Cấp"
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule created successfully"
 *               schedule:
 *                 id: "schedule-uuid-123"
 *                 classId: "abc-123-def-456"
 *                 name: "Học kỳ 1 2024-2025"
 *                 startDate: "2024-09-01T00:00:00.000Z"
 *                 endDate: "2025-01-15T00:00:00.000Z"
 *                 daysOfWeek: [1, 3, 5]
 *                 startTime: "07:00"
 *                 endTime: "09:00"
 *                 room: "A101"
 *                 description: "Lớp Toán Cao Cấp"
 *                 totalSessions: 45
 *       400:
 *         description: Missing required fields or schedule conflict
 *         content:
 *           application/json:
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: "Missing required fields"
 *               scheduleConflict:
 *                 value:
 *                   error: "Schedule conflict"
 *                   message: "Đã có lịch học trùng thời gian. Vui lòng chọn thời gian khác."
 *                   conflictingSchedules:
 *                     - id: "schedule-uuid-old"
 *                       name: "Học kỳ 1 2024-2025"
 *                       startDate: "2024-09-01T00:00:00.000Z"
 *                       endDate: "2025-01-15T00:00:00.000Z"
 *       403:
 *         description: Only the lecturer can create schedules
 *       404:
 *         description: Class not found
 */
router.post('/create', requireAuth, createSchedule);

/**
 * @swagger
 * /schedules/class/{classId}:
 *   get:
 *     summary: Get all schedules for a class
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         example: "abc-123-def-456"
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
 *           application/json:
 *             example:
 *               - id: "schedule-uuid-1"
 *                 classId: "abc-123-def-456"
 *                 name: "Học kỳ 1 2024-2025"
 *                 startDate: "2024-09-01T00:00:00.000Z"
 *                 endDate: "2025-01-15T00:00:00.000Z"
 *                 daysOfWeek: [1, 3, 5]
 *                 startTime: "07:00"
 *                 endTime: "09:00"
 *                 room: "A101"
 *                 description: "Lớp Toán Cao Cấp"
 *                 _count:
 *                   scheduleSessions: 45
 *                 createdAt: "2024-09-01T00:00:00.000Z"
 *                 updatedAt: "2024-09-01T00:00:00.000Z"
 */
router.get('/class/:classId', getSchedulesByClass);

/**
 * @swagger
 * /schedules/my-schedules:
 *   get:
 *     summary: Get all schedules for current student
 *     description: Lấy tất cả lịch học từ các lớp mà sinh viên đã tham gia
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of student's schedules
 *         content:
 *           application/json:
 *             example:
 *               - id: "schedule-uuid-1"
 *                 classId: "abc-123-def-456"
 *                 name: "Học kỳ 1 2024-2025"
 *                 startDate: "2024-09-01T00:00:00.000Z"
 *                 endDate: "2025-01-15T00:00:00.000Z"
 *                 daysOfWeek: [1, 3, 5]
 *                 startTime: "07:00"
 *                 endTime: "09:00"
 *                 room: "A101"
 *                 description: "Lớp Toán Cao Cấp"
 *                 class:
 *                   id: "abc-123-def-456"
 *                   name: "Toán Cao Cấp A1"
 *                   code: "MATH101"
 *                   lecturer:
 *                     displayName: "Nguyễn Văn A"
 *                 lecturerName: "Nguyễn Văn A"
 *                 _count:
 *                   scheduleSessions: 45
 *                 createdAt: "2024-09-01T00:00:00.000Z"
 *                 updatedAt: "2024-09-01T00:00:00.000Z"
 *       401:
 *         description: Unauthorized
 */
router.get('/my-schedules', requireAuth, getMySchedules);

/**
 * @swagger
 * /schedules/{scheduleId}/sessions:
 *   get:
 *     summary: Get schedule information and all sessions
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         example: "schedule-uuid-123"
 *     responses:
 *       200:
 *         description: Schedule information with sessions
 *         content:
 *           application/json:
 *             example:
 *               schedule:
 *                 id: "schedule-uuid-123"
 *                 classId: "abc-123-def-456"
 *                 name: "Học kỳ 1 2024-2025"
 *                 startDate: "2024-09-01T00:00:00.000Z"
 *                 endDate: "2025-01-15T00:00:00.000Z"
 *                 daysOfWeek: [1, 3, 5]
 *                 startTime: "07:00"
 *                 endTime: "09:00"
 *                 room: "A101"
 *                 description: "Lớp Toán Cao Cấp"
 *                 createdAt: "2024-09-01T00:00:00.000Z"
 *                 updatedAt: "2024-09-01T00:00:00.000Z"
 *                 class:
 *                   id: "abc-123-def-456"
 *                   name: "Toán Cao Cấp A1"
 *                   code: "MATH101"
 *               sessions:
 *                 - id: "session-uuid-1"
 *                   scheduleId: "schedule-uuid-123"
 *                   sessionDate: "2024-09-02T00:00:00.000Z"
 *                   sessionName: "Buổi 1"
 *                   status: "COMPLETED"
 *                   note: null
 *                   sessions:
 *                     - id: "attendance-session-uuid"
 *                       startAt: "2024-09-02T07:00:00.000Z"
 *                       endAt: "2024-09-02T09:00:00.000Z"
 *                       _count:
 *                         attendances: 38
 *                   createdAt: "2024-09-01T00:00:00.000Z"
 *                   updatedAt: "2024-09-01T00:00:00.000Z"
 *                 - id: "session-uuid-2"
 *                   scheduleId: "schedule-uuid-123"
 *                   sessionDate: "2024-09-04T00:00:00.000Z"
 *                   sessionName: "Buổi 2"
 *                   status: "SCHEDULED"
 *                   note: null
 *                   sessions: []
 *                   createdAt: "2024-09-01T00:00:00.000Z"
 *                   updatedAt: "2024-09-01T00:00:00.000Z"
 *       404:
 *         description: Schedule not found
 *         content:
 *           application/json:
 *             example:
 *               error: "Schedule not found"
 */
router.get('/:scheduleId/sessions', getScheduleSessions);

/**
 * @swagger
 * /schedules/sessions/{sessionId}:
 *   patch:
 *     summary: Update schedule session status
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "session-uuid-123"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SCHEDULED, COMPLETED, CANCELLED]
 *                 example: "CANCELLED"
 *               note:
 *                 type: string
 *                 example: "Nghỉ lễ Quốc Khánh"
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Session updated successfully"
 *               session:
 *                 id: "session-uuid-123"
 *                 scheduleId: "schedule-uuid-456"
 *                 sessionDate: "2024-09-02T00:00:00.000Z"
 *                 sessionName: "Buổi 1"
 *                 status: "CANCELLED"
 *                 note: "Nghỉ lễ Quốc Khánh"
 *                 createdAt: "2024-09-01T00:00:00.000Z"
 *                 updatedAt: "2024-09-02T10:00:00.000Z"
 */
router.patch('/sessions/:sessionId', requireAuth, updateScheduleSession);

/**
 * @swagger
 * /schedules/{scheduleId}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 *         example: "schedule-uuid-123"
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Schedule deleted successfully"
 *       403:
 *         description: Only the lecturer can delete schedules
 *       404:
 *         description: Schedule not found
 */
router.delete('/:scheduleId', requireAuth, deleteSchedule);

export default router;
