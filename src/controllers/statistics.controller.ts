import { Request, Response } from 'express';
import prisma from '../lib/prisma';

/**
 * Get attendance statistics for a student in a class
 * GET /api/statistics/student/:studentId/class/:classId
 */
export const getStudentAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { studentId, classId } = req.params;

    // Get student record
    const student = await prisma.student.findFirst({
      where: {
        studentId,
        classId,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found in this class' });
    }

    // Get all schedule sessions for this class
    const schedules = await prisma.schedule.findMany({
      where: { classId },
      include: {
        scheduleSessions: {
          include: {
            sessions: {
              include: {
                attendances: {
                  where: {
                    studentId: student.id,
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalSessions = 0;
    let attendedSessions = 0;
    const sessionDetails = [];

    for (const schedule of schedules) {
      for (const scheduleSession of schedule.scheduleSessions) {
        totalSessions++;
        const hasAttendance = scheduleSession.sessions.some(
          (session) => session.attendances.length > 0
        );

        if (hasAttendance) {
          attendedSessions++;
        }

        sessionDetails.push({
          sessionId: scheduleSession.id,
          sessionName: scheduleSession.sessionName,
          sessionDate: scheduleSession.sessionDate,
          status: scheduleSession.status,
          attended: hasAttendance,
          attendanceTime: hasAttendance
            ? scheduleSession.sessions[0]?.attendances[0]?.matchedAt
            : null,
        });
      }
    }

    const absentSessions = totalSessions - attendedSessions;
    const attendanceRate =
      totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : '0.00';

    res.json({
      student: {
        studentId: student.studentId,
        name: student.name,
        email: student.email,
      },
      statistics: {
        totalSessions,
        attendedSessions,
        absentSessions,
        attendanceRate: parseFloat(attendanceRate),
      },
      sessions: sessionDetails,
    });
  } catch (error: any) {
    console.error('Get student attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get attendance statistics for all students in a class
 * GET /api/statistics/class/:classId
 */
export const getClassAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
    });

    // Get all schedule sessions
    const schedules = await prisma.schedule.findMany({
      where: { classId },
      include: {
        scheduleSessions: {
          include: {
            sessions: {
              include: {
                attendances: true,
              },
            },
          },
        },
      },
    });

    let totalSessions = 0;
    const sessionIds: string[] = [];

    for (const schedule of schedules) {
      for (const scheduleSession of schedule.scheduleSessions) {
        totalSessions++;
        sessionIds.push(scheduleSession.id);
      }
    }

    const studentStats = [];

    for (const student of students) {
      let attendedSessions = 0;

      for (const schedule of schedules) {
        for (const scheduleSession of schedule.scheduleSessions) {
          const hasAttendance = scheduleSession.sessions.some((session) =>
            session.attendances.some((att) => att.studentId === student.id)
          );

          if (hasAttendance) {
            attendedSessions++;
          }
        }
      }

      const absentSessions = totalSessions - attendedSessions;
      const attendanceRate =
        totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : '0.00';

      studentStats.push({
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        totalSessions,
        attendedSessions,
        absentSessions,
        attendanceRate: parseFloat(attendanceRate),
      });
    }

    res.json({
      classId,
      totalSessions,
      totalStudents: students.length,
      students: studentStats,
    });
  } catch (error: any) {
    console.error('Get class attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get attendance statistics for a specific schedule session
 * GET /api/statistics/session/:scheduleSessionId
 */
export const getSessionAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { scheduleSessionId } = req.params;

    const scheduleSession = await prisma.scheduleSession.findUnique({
      where: { id: scheduleSessionId },
      include: {
        schedule: {
          include: {
            class: {
              include: {
                students: true,
              },
            },
          },
        },
        sessions: {
          include: {
            attendances: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!scheduleSession) {
      return res.status(404).json({ error: 'Schedule session not found' });
    }

    const totalStudents = scheduleSession.schedule.class.students.length;
    const attendedStudents = new Set(
      scheduleSession.sessions.flatMap((session) =>
        session.attendances.map((att) => att.studentId)
      )
    ).size;

    const absentStudents = totalStudents - attendedStudents;
    const attendanceRate =
      totalStudents > 0 ? ((attendedStudents / totalStudents) * 100).toFixed(2) : '0.00';

    const attendedList = scheduleSession.sessions.flatMap((session) =>
      session.attendances.map((att) => ({
        studentId: att.student.studentId,
        name: att.student.name,
        method: att.method,
        matchedAt: att.matchedAt,
      }))
    );

    const allStudentIds = new Set(
      scheduleSession.schedule.class.students.map((s) => s.id)
    );
    const attendedStudentIds = new Set(
      scheduleSession.sessions.flatMap((session) =>
        session.attendances.map((att) => att.studentId)
      )
    );

    const absentList = scheduleSession.schedule.class.students
      .filter((s) => !attendedStudentIds.has(s.id))
      .map((s) => ({
        studentId: s.studentId,
        name: s.name,
      }));

    res.json({
      session: {
        id: scheduleSession.id,
        name: scheduleSession.sessionName,
        date: scheduleSession.sessionDate,
        status: scheduleSession.status,
      },
      statistics: {
        totalStudents,
        attendedStudents,
        absentStudents,
        attendanceRate: parseFloat(attendanceRate),
      },
      attended: attendedList,
      absent: absentList,
    });
  } catch (error: any) {
    console.error('Get session attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
