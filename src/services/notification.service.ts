import prisma from '../lib/prisma';
import cron from 'node-cron';
import { NotificationType } from '@prisma/client';

/**
 * Send notification to all students in a class
 */
export const sendNotificationToClass = async (
  classId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) => {
  try {
    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      select: {
        studentId: true,
        email: true,  // ← Lấy email từ Student
      },
    });

    if (students.length === 0) {
      return { count: 0 };
    }

    // Get user IDs for all students by email
    const studentEmails = students.map(s => s.email);
    
    const studentUserIds = await prisma.user.findMany({
      where: {
        email: {
          in: studentEmails,  // ← Dùng email có sẵn
        },
      },
      select: {
        uid: true,
      },
    });

    if (studentUserIds.length === 0) {
      return { count: 0 };
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

    console.log(`✅ Sent ${notifications.count} notifications for class ${classId}`);
    return notifications;
  } catch (error) {
    console.error('Error sending notification to class:', error);
    throw error;
  }
};

/**
 * Check for upcoming sessions and send reminders
 * Runs every 5 minutes
 */
export const checkUpcomingSessionsAndNotify = async () => {
  try {
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
    const in35Minutes = new Date(now.getTime() + 35 * 60 * 1000);

    // Get all schedule sessions happening in the next 30-35 minutes
    const upcomingSessions = await prisma.scheduleSession.findMany({
      where: {
        sessionDate: {
          gte: in30Minutes,
          lte: in35Minutes,
        },
        status: 'SCHEDULED',
      },
      include: {
        schedule: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    console.log(`🔍 Found ${upcomingSessions.length} upcoming sessions`);

    for (const session of upcomingSessions) {
      const sessionTime = new Date(session.sessionDate);
      const scheduleStartTime = session.schedule.startTime; // "07:00"
      const [hours, minutes] = scheduleStartTime.split(':').map(Number);
      sessionTime.setHours(hours, minutes, 0, 0);

      const timeUntilSession = Math.round((sessionTime.getTime() - now.getTime()) / (60 * 1000));

      // Check if we already sent notification for this session
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'SESSION_REMINDER',
          data: {
            path: ['sessionId'],
            equals: session.id,
          },
        },
      });

      if (existingNotification) {
        console.log(`⏭️  Already sent reminder for session ${session.id}`);
        continue;
      }

      // Send notification to all students in the class
      await sendNotificationToClass(
        session.schedule.classId,
        'SESSION_REMINDER',
        `Nhắc nhở: Buổi học sắp diễn ra`,
        `${session.sessionName} - ${session.schedule.class.name} sẽ bắt đầu sau ${timeUntilSession} phút. Phòng: ${session.schedule.room || 'Chưa xác định'}`,
        {
          sessionId: session.id,
          scheduleId: session.scheduleId,
          classId: session.schedule.classId,
          sessionDate: session.sessionDate,
          startTime: scheduleStartTime,
          room: session.schedule.room,
        }
      );

      console.log(`📢 Sent reminder for: ${session.sessionName} - ${session.schedule.class.name}`);
    }
  } catch (error) {
    console.error('Error checking upcoming sessions:', error);
  }
};

/**
 * Start the notification scheduler
 * Runs every 5 minutes
 */
export const startNotificationScheduler = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔔 Running notification scheduler...');
    await checkUpcomingSessionsAndNotify();
  });

  console.log('✅ Notification scheduler started (runs every 5 minutes)');
  
  // Run immediately on startup
  checkUpcomingSessionsAndNotify();
};
