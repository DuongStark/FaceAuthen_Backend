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
 * Start a new session
 * POST /api/sessions/start
 */
export const startSession = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, scheduleSessionId } = req.body;
    const userId = req.user?.uid;

    if (!classId) {
      return res.status(400).json({ error: 'ClassId is required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if there's an active session for this class
    const activeSession = await prisma.session.findFirst({
      where: {
        classId,
        endAt: null,
      },
    });

    if (activeSession) {
      return res.status(400).json({ error: 'There is already an active session for this class' });
    }

    // If scheduleSessionId is provided, verify it exists and belongs to this class
    if (scheduleSessionId) {
      const scheduleSession = await prisma.scheduleSession.findUnique({
        where: { id: scheduleSessionId },
        include: {
          schedule: {
            select: {
              classId: true,
              name: true,
            },
          },
        },
      });

      if (!scheduleSession) {
        return res.status(404).json({ error: 'Schedule session not found' });
      }

      if (scheduleSession.schedule.classId !== classId) {
        return res.status(400).json({ error: 'Schedule session does not belong to this class' });
      }

      // Check if this schedule session already has an attendance session
      const existingSession = await prisma.session.findFirst({
        where: {
          scheduleSessionId,
        },
      });

      if (existingSession) {
        return res.status(400).json({ 
          error: 'This schedule session already has an attendance session',
          existingSessionId: existingSession.id,
        });
      }
    }

    // Create new session
    const session = await prisma.session.create({
      data: {
        classId,
        scheduleSessionId: scheduleSessionId || null,
        createdBy: userId,
        startAt: new Date(),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        scheduleSession: scheduleSessionId ? {
          select: {
            id: true,
            sessionName: true,
            sessionDate: true,
          },
        } : undefined,
      },
    });

    res.status(201).json({
      message: 'Session started successfully',
      session: {
        id: session.id,
        classId: session.classId,
        className: session.class.name,
        classCode: session.class.code,
        startAt: session.startAt,
        createdBy: session.createdBy,
      },
    });
  } catch (error: any) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * End a session
 * POST /api/sessions/:id/end
 */
export const endSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.endAt) {
      return res.status(400).json({ error: 'Session is already ended' });
    }

    // Update session endAt
    await prisma.session.update({
      where: { id },
      data: {
        endAt: new Date(),
      },
    });

    res.json({ message: 'Session ended successfully' });
  } catch (error: any) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get active session for a class
 * GET /api/sessions/active/:classId
 */
export const getActiveSession = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    const session = await prisma.session.findFirst({
      where: {
        classId,
        endAt: null,
      },
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

    if (!session) {
      return res.status(404).json({ error: 'No active session found' });
    }

    res.json({
      id: session.id,
      classId: session.classId,
      className: session.class.name,
      classCode: session.class.code,
      startAt: session.startAt,
      createdBy: session.createdBy,
    });
  } catch (error: any) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
