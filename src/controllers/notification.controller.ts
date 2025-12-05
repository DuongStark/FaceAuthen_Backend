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

/**
 * Get sent notifications by lecturer (grouped by notification content)
 * GET /api/notifications/sent
 * Returns unique notifications sent, not per-recipient
 */
export const getSentNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.uid;

    if (currentUserRole !== 'admin' && currentUserRole !== 'lecturer') {
      return res.status(403).json({ error: 'Only admin or lecturer can view sent notifications' });
    }

    const { page = '1', limit = '20', classId, type } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Get classes owned by this lecturer
    const lecturerClasses = await prisma.class.findMany({
      where: { lecturerId: currentUserId },
      select: { id: true, name: true },
    });

    const classIds = lecturerClasses.map(c => c.id);

    if (classIds.length === 0) {
      return res.json({
        notifications: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Get students in lecturer's classes  
    let targetClassIds = classIds;
    if (classId) {
      // Verify classId belongs to lecturer
      if (!classIds.includes(classId as string)) {
        return res.status(403).json({ error: 'Class not found or unauthorized' });
      }
      targetClassIds = [classId as string];
    }

    const studentsInClasses = await prisma.student.findMany({
      where: { classId: { in: targetClassIds } },
      select: { email: true, classId: true },
    });

    const studentEmails = studentsInClasses.map(s => s.email);

    // Get user IDs of these students
    const studentUsers = await prisma.user.findMany({
      where: { email: { in: studentEmails } },
      select: { uid: true },
    });

    const studentUserIds = studentUsers.map(u => u.uid);

    if (studentUserIds.length === 0) {
      return res.json({
        notifications: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build where clause
    const where: any = {
      userId: { in: studentUserIds },
    };

    if (type) {
      where.type = type;
    }

    // Get all notifications grouped by content (type, title, message, createdAt within 1 second)
    const allNotifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        title: true,
        message: true,
        createdAt: true,
        isRead: true,
      },
    });

    // Group notifications by content (same type, title, message sent at same time = same notification)
    const groupedMap = new Map<string, {
      type: string;
      title: string;
      message: string;
      createdAt: Date;
      recipientCount: number;
      readCount: number;
    }>();

    allNotifications.forEach(notif => {
      // Round to second to group notifications sent at the same time
      const timeKey = new Date(notif.createdAt).toISOString().slice(0, 19);
      const key = `${notif.type}|${notif.title}|${notif.message}|${timeKey}`;
      
      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.recipientCount++;
        if (notif.isRead) existing.readCount++;
      } else {
        groupedMap.set(key, {
          type: notif.type,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt,
          recipientCount: 1,
          readCount: notif.isRead ? 1 : 0,
        });
      }
    });

    // Convert to array and sort by createdAt desc
    const groupedNotifications = Array.from(groupedMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = groupedNotifications.length;
    const paginatedNotifications = groupedNotifications.slice(skip, skip + limitNum);

    res.json({
      notifications: paginatedNotifications.map(notif => ({
        type: notif.type,
        title: notif.title,
        message: notif.message,
        createdAt: notif.createdAt,
        recipientCount: notif.recipientCount,
        readCount: notif.readCount,
        readRate: Math.round((notif.readCount / notif.recipientCount) * 100),
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get sent notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get notification statistics for lecturer
 * GET /api/notifications/stats
 */
export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.uid;

    if (currentUserRole !== 'admin' && currentUserRole !== 'lecturer') {
      return res.status(403).json({ error: 'Only admin or lecturer can view notification stats' });
    }

    // Get classes owned by this lecturer
    const lecturerClasses = await prisma.class.findMany({
      where: { lecturerId: currentUserId },
      select: { id: true, name: true },
    });

    const classIds = lecturerClasses.map(c => c.id);

    // Get students in lecturer's classes
    const studentsInClasses = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      select: { email: true, classId: true },
    });

    const studentEmails = studentsInClasses.map(s => s.email);

    // Get user IDs of these students
    const studentUsers = await prisma.user.findMany({
      where: { email: { in: studentEmails } },
      select: { uid: true },
    });

    const studentUserIds = studentUsers.map(u => u.uid);

    // Get notification counts
    const [totalSent, totalRead, totalUnread, byType] = await Promise.all([
      prisma.notification.count({
        where: { userId: { in: studentUserIds } },
      }),
      prisma.notification.count({
        where: { userId: { in: studentUserIds }, isRead: true },
      }),
      prisma.notification.count({
        where: { userId: { in: studentUserIds }, isRead: false },
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId: { in: studentUserIds } },
        _count: { type: true },
      }),
    ]);

    res.json({
      stats: {
        totalSent,
        totalRead,
        totalUnread,
        readRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0,
        byType: byType.map(item => ({
          type: item.type,
          count: item._count.type,
        })),
        classCount: lecturerClasses.length,
        studentCount: studentsInClasses.length,
      },
    });
  } catch (error: any) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
