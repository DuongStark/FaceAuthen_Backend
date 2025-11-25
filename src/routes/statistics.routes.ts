import express from 'express';
import {
  getStudentAttendanceStats,
  getClassAttendanceStats,
  getSessionAttendanceStats,
  getAdminOverview,
  getWeeklyStats,
} from '../controllers/statistics.controller';

const router = express.Router();

/**
 * @swagger
 * /statistics/student/{studentId}/class/{classId}:
 *   get:
 *     summary: Get attendance statistics for a student
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         example: "D23DCCN001"
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         example: "abc-123-def-456"
 *     responses:
 *       200:
 *         description: Student attendance statistics
 *         content:
 *           application/json:
 *             example:
 *               student:
 *                 studentId: "D23DCCN001"
 *                 name: "Nguyễn Văn An"
 *                 email: "d23dccn001@stu.ptit.edu.vn"
 *               statistics:
 *                 totalSessions: 20
 *                 attendedSessions: 18
 *                 absentSessions: 2
 *                 attendanceRate: 90.00
 *               sessions:
 *                 - sessionId: "session-uuid-1"
 *                   sessionName: "Buổi 1"
 *                   sessionDate: "2024-09-02T00:00:00.000Z"
 *                   status: "COMPLETED"
 *                   attended: true
 *                   attendanceTime: "2024-09-02T07:05:00.000Z"
 *                 - sessionId: "session-uuid-2"
 *                   sessionName: "Buổi 2"
 *                   sessionDate: "2024-09-04T00:00:00.000Z"
 *                   status: "COMPLETED"
 *                   attended: false
 *                   attendanceTime: null
 *       404:
 *         description: Student not found in this class
 */
router.get('/student/:studentId/class/:classId', getStudentAttendanceStats);

/**
 * @swagger
 * /statistics/class/{classId}:
 *   get:
 *     summary: Get attendance statistics for all students in a class
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         example: "abc-123-def-456"
 *     responses:
 *       200:
 *         description: Class attendance statistics
 *         content:
 *           application/json:
 *             example:
 *               classId: "abc-123-def-456"
 *               totalSessions: 20
 *               totalStudents: 40
 *               students:
 *                 - studentId: "D23DCCN001"
 *                   name: "Nguyễn Văn An"
 *                   email: "d23dccn001@stu.ptit.edu.vn"
 *                   totalSessions: 20
 *                   attendedSessions: 18
 *                   absentSessions: 2
 *                   attendanceRate: 90.00
 *                 - studentId: "D23DCCN002"
 *                   name: "Trần Thị Bình"
 *                   email: "d23dccn002@stu.ptit.edu.vn"
 *                   totalSessions: 20
 *                   attendedSessions: 20
 *                   absentSessions: 0
 *                   attendanceRate: 100.00
 */
router.get('/class/:classId', getClassAttendanceStats);

/**
 * @swagger
 * /statistics/session/{scheduleSessionId}:
 *   get:
 *     summary: Get attendance statistics for a specific session
 *     tags: [Statistics]
 *     parameters:
 *       - in: path
 *         name: scheduleSessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "session-uuid-123"
 *     responses:
 *       200:
 *         description: Session attendance statistics
 *         content:
 *           application/json:
 *             example:
 *               session:
 *                 id: "session-uuid-123"
 *                 name: "Buổi 1"
 *                 date: "2024-09-02T00:00:00.000Z"
 *                 status: "COMPLETED"
 *               statistics:
 *                 totalStudents: 40
 *                 attendedStudents: 38
 *                 absentStudents: 2
 *                 attendanceRate: 95.00
 *               attended:
 *                 - studentId: "D23DCCN001"
 *                   name: "Nguyễn Văn An"
 *                   method: "face"
 *                   matchedAt: "2024-09-02T07:05:00.000Z"
 *                 - studentId: "D23DCCN002"
 *                   name: "Trần Thị Bình"
 *                   method: "face"
 *                   matchedAt: "2024-09-02T07:08:00.000Z"
 *               absent:
 *                 - studentId: "D23DCCN003"
 *                   name: "Lê Hoàng Cường"
 *                 - studentId: "D23DCCN004"
 *                   name: "Phạm Thị Dung"
 *       404:
 *         description: Schedule session not found
 */
router.get('/session/:scheduleSessionId', getSessionAttendanceStats);

/**
 * @swagger
 * /statistics/admin/overview:
 *   get:
 *     summary: Get overall statistics for admin dashboard
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Admin overview statistics
 *         content:
 *           application/json:
 *             example:
 *               overview:
 *                 totalClasses: 15
 *                 totalStudents: 450
 *                 totalLecturers: 8
 *                 totalSessions: 120
 *                 overallAttendanceRate: 85.50
 *                 overallAbsentRate: 14.50
 *               details:
 *                 totalExpectedAttendances: 5400
 *                 totalActualAttendances: 4617
 *                 totalMissedAttendances: 783
 */
router.get('/admin/overview', getAdminOverview);

/**
 * @swagger
 * /statistics/admin/weekly:
 *   get:
 *     summary: Get weekly attendance statistics for admin dashboard
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [current-week, last-week]
 *         description: Quick select period (current-week = tuần này, last-week = tuần trước). Nếu không dùng period, mặc định lấy 4 tuần gần nhất
 *         example: "current-week"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom range (bỏ qua nếu dùng period)
 *         example: "2024-08-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom range (bỏ qua nếu dùng period)
 *         example: "2024-09-01"
 *     responses:
 *       200:
 *         description: Weekly attendance statistics
 *         content:
 *           application/json:
 *             example:
 *               period:
 *                 startDate: "2024-08-01T00:00:00.000Z"
 *                 endDate: "2024-09-01T00:00:00.000Z"
 *               weeklyStats:
 *                 - weekStart: "2024-08-05T00:00:00.000Z"
 *                   weekEnd: "2024-08-11T23:59:59.999Z"
 *                   totalSessions: 30
 *                   totalExpected: 1200
 *                   totalAttended: 1050
 *                   totalAbsent: 150
 *                   attendanceRate: 87.50
 *                   absentRate: 12.50
 *                 - weekStart: "2024-08-12T00:00:00.000Z"
 *                   weekEnd: "2024-08-18T23:59:59.999Z"
 *                   totalSessions: 28
 *                   totalExpected: 1120
 *                   totalAttended: 952
 *                   totalAbsent: 168
 *                   attendanceRate: 85.00
 *                   absentRate: 15.00
 */
router.get('/admin/weekly', getWeeklyStats);

export default router;
