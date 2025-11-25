import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.uid;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification,
    });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.uid;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create notification for a specific student (admin/lecturer only)
 * POST /api/notifications/create-for-student
 */
export const createNotificationForStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, type, title, message, data } = req.body;
    const currentUserRole = req.user?.role;

    if (currentUserRole !== 'admin' && currentUserRole !== 'lecturer') {
      return res.status(403).json({ error: 'Only admin or lecturer can create notifications' });
    }

    if (!studentId || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find student by studentId
    const student = await prisma.student.findFirst({
      where: { studentId },
      select: {
        id: true,
        studentId: true,
        email: true,
        name: true,
        class: {
          select: {
            id: true,
            name: true,
            lecturerId: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ 
        error: 'Student not found',
        message: `Student ${studentId} not found`
      });
    }

    // Verify ownership if lecturer
    if (currentUserRole === 'lecturer' && student.class.lecturerId !== req.user?.uid) {
      return res.status(403).json({ error: 'You can only send notifications to students in your own classes' });
    }

    // Find user by student email
    const user = await prisma.user.findUnique({
      where: { email: student.email },
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User account not found',
        message: `Student ${studentId} (${student.name}) does not have a user account yet`
      });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.uid,
        type,
        title,
        message,
        data: data || null,
      },
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification: {
        ...notification,
        recipient: {
          studentId: student.studentId,
          name: student.name,
          email: student.email,
          class: student.class.name,
        },
      },
    });
  } catch (error: any) {
    console.error('Create notification for student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create notification for all students in a class
 * POST /api/notifications/create-for-class
 */
export const createNotificationForClass = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, type, title, message, data } = req.body;
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.uid;

    if (currentUserRole !== 'admin' && currentUserRole !== 'lecturer') {
      return res.status(403).json({ error: 'Only admin or lecturer can create notifications' });
    }

    if (!classId || !type || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get class and verify ownership if lecturer
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          select: {
            studentId: true,
            email: true,  // ← Lấy email từ Student
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (currentUserRole === 'lecturer' && classData.lecturerId !== currentUserId) {
      return res.status(403).json({ error: 'You can only send notifications to your own classes' });
    }

    // Get user IDs for all students in the class by email
    const studentEmails = classData.students.map(s => s.email);
    
    const studentUserIds = await prisma.user.findMany({
      where: {
        email: {
          in: studentEmails,  // ← Dùng email có sẵn từ Student
        },
      },
      select: {
        uid: true,
        email: true,
      },
    });

    if (studentUserIds.length === 0) {
      return res.status(404).json({ 
        error: 'No users found',
        message: 'No student users found for this class. Make sure students have user accounts.'
      });
    }

    // Create notifications for all students
    const notifications = await prisma.notification.createMany({
      data: studentUserIds.map(user => ({
        userId: user.uid,
        type,
        title,
        message,
        data: data || null,
      })),
    });

    res.status(201).json({
      message: 'Notifications created successfully',
      count: notifications.count,
    });
  } catch (error: any) {
    console.error('Create notification for class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
