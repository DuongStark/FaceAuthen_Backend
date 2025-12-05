import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotificationForStudent,
  createNotificationForClass,
  getSentNotifications,
  getNotificationStats,
} from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Filter only unread notifications
 *         example: true
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             example:
 *               notifications:
 *                 - id: "notif-uuid-1"
 *                   userId: "user-uuid-123"
 *                   type: "SCHEDULE_CREATED"
 *                   title: "Lịch học mới"
 *                   message: "Lịch học Toán Cao Cấp đã được tạo cho học kỳ 1 2024-2025"
 *                   data:
 *                     scheduleId: "schedule-uuid-abc"
 *                     classId: "class-uuid-def"
 *                   isRead: false
 *                   createdAt: "2024-09-01T10:00:00.000Z"
 *                   readAt: null
 *                 - id: "notif-uuid-2"
 *                   userId: "user-uuid-123"
 *                   type: "SESSION_REMINDER"
 *                   title: "Nhắc nhở buổi học"
 *                   message: "Buổi học Toán Cao Cấp sẽ bắt đầu sau 30 phút"
 *                   data:
 *                     sessionId: "session-uuid-xyz"
 *                   isRead: true
 *                   createdAt: "2024-09-02T06:30:00.000Z"
 *                   readAt: "2024-09-02T06:35:00.000Z"
 *               unreadCount: 1
 */
router.get('/', requireAuth, getUserNotifications);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         example: "notif-uuid-123"
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             example:
 *               message: "Notification marked as read"
 *               notification:
 *                 id: "notif-uuid-123"
 *                 isRead: true
 *                 readAt: "2024-09-02T08:00:00.000Z"
 *       404:
 *         description: Notification not found
 *       403:
 *         description: Unauthorized
 */
router.patch('/:notificationId/read', requireAuth, markNotificationAsRead);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             example:
 *               message: "All notifications marked as read"
 *               count: 5
 */
router.patch('/read-all', requireAuth, markAllNotificationsAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         example: "notif-uuid-123"
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 *       403:
 *         description: Unauthorized
 */
router.delete('/:notificationId', requireAuth, deleteNotification);

/**
 * @swagger
 * /notifications/create-for-student:
 *   post:
 *     summary: Create notification for a specific student (admin/lecturer only)
 *     tags: [Notifications]
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
 *               - type
 *               - title
 *               - message
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "D23DCCN001"
 *                 description: Student ID (mã sinh viên)
 *               type:
 *                 type: string
 *                 enum: [SCHEDULE_CREATED, SCHEDULE_UPDATED, SCHEDULE_CANCELLED, SESSION_REMINDER, ATTENDANCE_MARKED, GENERAL]
 *                 example: "GENERAL"
 *               title:
 *                 type: string
 *                 example: "Thông báo cá nhân"
 *               message:
 *                 type: string
 *                 example: "Bạn cần bổ sung ảnh khuôn mặt để điểm danh"
 *               data:
 *                 type: object
 *                 example:
 *                   reason: "missing_face_image"
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Notification created successfully"
 *               notification:
 *                 id: "notif-uuid-123"
 *                 userId: "user-uuid-456"
 *                 type: "GENERAL"
 *                 title: "Thông báo cá nhân"
 *                 message: "Bạn cần bổ sung ảnh khuôn mặt để điểm danh"
 *                 isRead: false
 *                 createdAt: "2024-11-25T10:00:00.000Z"
 *                 recipient:
 *                   studentId: "D23DCCN001"
 *                   name: "Nguyễn Văn An"
 *                   email: "d23dccn001@stu.ptit.edu.vn"
 *       404:
 *         description: Student or user account not found
 *       403:
 *         description: Only admin or lecturer can create notifications
 */
router.post('/create-for-student', requireAuth, createNotificationForStudent);

/**
 * @swagger
 * /notifications/create-for-class:
 *   post:
 *     summary: Create notification for all students in a class (admin/lecturer only)
 *     tags: [Notifications]
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
 *               - type
 *               - title
 *               - message
 *             properties:
 *               classId:
 *                 type: string
 *                 example: "class-uuid-abc"
 *               type:
 *                 type: string
 *                 enum: [SCHEDULE_CREATED, SCHEDULE_UPDATED, SCHEDULE_CANCELLED, SESSION_REMINDER, ATTENDANCE_MARKED, GENERAL]
 *                 example: "SCHEDULE_CREATED"
 *               title:
 *                 type: string
 *                 example: "Lịch học mới"
 *               message:
 *                 type: string
 *                 example: "Lịch học Toán Cao Cấp đã được tạo"
 *               data:
 *                 type: object
 *                 example:
 *                   scheduleId: "schedule-uuid-123"
 *     responses:
 *       201:
 *         description: Notifications created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Notifications created successfully"
 *               count: 40
 *       403:
 *         description: Only admin or lecturer can create notifications
 *       404:
 *         description: Class not found
 */
router.post('/create-for-class', requireAuth, createNotificationForClass);

/**
 * @swagger
 * /notifications/sent:
 *   get:
 *     summary: Xem danh sách thông báo đã gửi (grouped by content)
 *     description: |
 *       Trả về danh sách các thông báo mà giảng viên đã gửi, gộp theo nội dung.
 *       Mỗi item là một thông báo unique (cùng type, title, message, thời gian gửi).
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SCHEDULE_CREATED, SCHEDULE_UPDATED, SCHEDULE_CANCELLED, SESSION_REMINDER, ATTENDANCE_MARKED, ATTENDANCE_REMINDER, GENERAL]
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: List of sent notifications (grouped)
 *         content:
 *           application/json:
 *             example:
 *               notifications:
 *                 - type: "GENERAL"
 *                   title: "Thông báo chung"
 *                   message: "Nhắc nhở nộp bài tập"
 *                   createdAt: "2024-11-25T10:00:00.000Z"
 *                   recipientCount: 40
 *                   readCount: 35
 *                   readRate: 88
 *                 - type: "SCHEDULE_CREATED"
 *                   title: "Lịch học mới"
 *                   message: "Lịch học kỳ 2 đã được tạo"
 *                   createdAt: "2024-11-24T08:00:00.000Z"
 *                   recipientCount: 40
 *                   readCount: 40
 *                   readRate: 100
 *               pagination:
 *                 page: 1
 *                 limit: 20
 *                 total: 5
 *                 totalPages: 1
 *       403:
 *         description: Only lecturer/admin can view sent notifications
 */
router.get('/sent', requireAuth, getSentNotifications);

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     summary: Get notification statistics for lecturer
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *         content:
 *           application/json:
 *             example:
 *               stats:
 *                 totalSent: 150
 *                 totalRead: 120
 *                 totalUnread: 30
 *                 readRate: 80
 *                 byType:
 *                   - type: "GENERAL"
 *                     count: 50
 *                   - type: "SCHEDULE_CREATED"
 *                     count: 40
 *                   - type: "ATTENDANCE_REMINDER"
 *                     count: 60
 *                 classCount: 3
 *                 studentCount: 120
 *       403:
 *         description: Only lecturer/admin can view notification stats
 */
router.get('/stats', requireAuth, getNotificationStats);

export default router;
