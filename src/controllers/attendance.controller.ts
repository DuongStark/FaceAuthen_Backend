import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

// Store for SSE connections
const sseClients: Map<string, Response[]> = new Map();

/**
 * Record attendance
 * POST /api/attendance/record
 */
export const recordAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, studentId, method, matchedAt } = req.body;

    if (!sessionId || !studentId || !method) {
      return res.status(400).json({ error: 'SessionId, studentId, and method are required' });
    }

    // Check if session is active
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.endAt) {
      return res.status(400).json({ error: 'Session is already ended' });
    }

    // Get student record
    const student = await prisma.student.findFirst({
      where: { studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Anti-duplicate: Check if there's a recent attendance within 120 seconds
    const now = matchedAt ? new Date(matchedAt) : new Date();
    const twoMinutesAgo = new Date(now.getTime() - 120000); // 120 seconds = 2 minutes

    const recentAttendance = await prisma.attendance.findFirst({
      where: {
        sessionId,
        studentId: student.id,
        matchedAt: {
          gte: twoMinutesAgo,
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    });

    if (recentAttendance) {
      const timeDiff = (now.getTime() - recentAttendance.matchedAt.getTime()) / 1000;
      return res.status(400).json({
        error: 'Duplicate attendance detected',
        message: `Attendance was recorded ${Math.round(timeDiff)} seconds ago. Please wait at least 120 seconds.`,
      });
    }

    // Record attendance
    const attendance = await prisma.attendance.create({
      data: {
        sessionId,
        studentId: student.id,
        method,
        matchedAt: now,
      },
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Broadcast to SSE clients
    const clients = sseClients.get(sessionId);
    if (clients) {
      clients.forEach((client) => {
        client.write(`data: ${JSON.stringify(attendance)}\n\n`);
      });
    }

    res.status(201).json({
      message: 'Attendance recorded successfully',
      id: attendance.id,
      attendance: {
        id: attendance.id,
        studentId: attendance.student.studentId,
        studentName: attendance.student.name,
        method: attendance.method,
        matchedAt: attendance.matchedAt,
      },
    });
  } catch (error: any) {
    console.error('Record attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List attendance for a session
 * GET /api/attendance/:sessionId
 */
export const listAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const attendances = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            studentId: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        matchedAt: 'desc',
      },
    });

    res.json(attendances.map((a: any) => ({
      id: a.id,
      studentId: a.student.studentId,
      studentName: a.student.name,
      method: a.method,
      matchedAt: a.matchedAt,
    })));
  } catch (error: any) {
    console.error('List attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Subscribe to attendance updates (Server-Sent Events)
 * GET /api/attendance/:sessionId/subscribe
 */
export const subscribeAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add client to list
    if (!sseClients.has(sessionId)) {
      sseClients.set(sessionId, []);
    }
    sseClients.get(sessionId)!.push(res);

    // Send initial data
    res.write(`data: ${JSON.stringify({ message: 'Connected' })}\n\n`);

    // Handle client disconnect
    req.on('close', () => {
      const clients = sseClients.get(sessionId);
      if (clients) {
        const index = clients.indexOf(res);
        if (index > -1) {
          clients.splice(index, 1);
        }
        if (clients.length === 0) {
          sseClients.delete(sessionId);
        }
      }
      res.end();
    });
  } catch (error: any) {
    console.error('Subscribe attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
