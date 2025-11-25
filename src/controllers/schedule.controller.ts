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
 * Create a new schedule
 * POST /api/schedules/create
 */
export const createSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, name, startDate, endDate, daysOfWeek, startTime, endTime, room, description } = req.body;
    const userId = req.user?.uid;

    if (!classId || !name || !startDate || !endDate || !daysOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify class exists and user is the lecturer
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classData.lecturerId !== userId) {
      return res.status(403).json({ error: 'Only the lecturer can create schedules' });
    }

    // Check for overlapping schedules
    const overlappingSchedules = await prisma.schedule.findMany({
      where: {
        classId,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
        ],
      },
    });

    if (overlappingSchedules.length > 0) {
      return res.status(400).json({ 
        error: 'Schedule conflict',
        message: 'Đã có lịch học trùng thời gian. Vui lòng chọn thời gian khác.',
        conflictingSchedules: overlappingSchedules.map((s: any) => ({
          id: s.id,
          name: s.name,
          startDate: s.startDate,
          endDate: s.endDate,
        })),
      });
    }

    // Create schedule
    const schedule = await prisma.schedule.create({
      data: {
        classId,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysOfWeek,
        startTime,
        endTime,
        room,
        description,
      },
    });

    // Auto-generate schedule sessions based on daysOfWeek
    const sessions = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let sessionNumber = 1;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ...
      
      if (daysOfWeek.includes(dayOfWeek)) {
        sessions.push({
          scheduleId: schedule.id,
          sessionDate: new Date(date),
          sessionName: `Buổi ${sessionNumber}`,
          status: 'SCHEDULED' as const,
        });
        sessionNumber++;
      }
    }

    // Create all sessions in batch
    if (sessions.length > 0) {
      await prisma.scheduleSession.createMany({
        data: sessions,
      });
    }

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: {
        ...schedule,
        totalSessions: sessions.length,
      },
    });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all schedules for a class
 * GET /api/schedules/class/:classId
 */
export const getSchedulesByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const schedules = await prisma.schedule.findMany({
      where: { classId },
      include: {
        _count: {
          select: {
            scheduleSessions: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    res.json(schedules);
  } catch (error: any) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get schedule sessions for a schedule
 * GET /api/schedules/:scheduleId/sessions
 */
export const getScheduleSessions = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;

    // Get schedule information
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Get sessions for this schedule
    const sessions = await prisma.scheduleSession.findMany({
      where: { scheduleId },
      include: {
        sessions: {
          select: {
            id: true,
            startAt: true,
            endAt: true,
            _count: {
              select: {
                attendances: true,
              },
            },
          },
        },
      },
      orderBy: {
        sessionDate: 'asc',
      },
    });

    res.json({
      schedule,
      sessions,
    });
  } catch (error: any) {
    console.error('Get schedule sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update schedule session status
 * PATCH /api/schedules/sessions/:sessionId
 */
export const updateScheduleSession = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status, note } = req.body;

    const session = await prisma.scheduleSession.update({
      where: { id: sessionId },
      data: {
        status,
        note,
      },
    });

    res.json({
      message: 'Session updated successfully',
      session,
    });
  } catch (error: any) {
    console.error('Update schedule session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a schedule (and all its sessions)
 * DELETE /api/schedules/:scheduleId
 */
export const deleteSchedule = async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user?.uid;

    // Verify ownership
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        class: true,
      },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (schedule.class.lecturerId !== userId) {
      return res.status(403).json({ error: 'Only the lecturer can delete schedules' });
    }

    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
