import express from 'express';
import {
  getStudentAttendanceStats,
  getClassAttendanceStats,
  getSessionAttendanceStats,
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

export default router;
