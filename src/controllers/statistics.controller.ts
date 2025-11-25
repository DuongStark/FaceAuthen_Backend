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

/**
 * Get overall statistics for admin dashboard
 * GET /api/statistics/admin/overview
 */
export const getAdminOverview = async (req: Request, res: Response) => {
  try {
    // Total classes
    const totalClasses = await prisma.class.count();

    // Total students
    const totalStudents = await prisma.student.count();

    // Total lecturers
    const totalLecturers = await prisma.user.count({
      where: { role: 'lecturer' },
    });

    // Get all schedule sessions
    const allScheduleSessions = await prisma.scheduleSession.findMany({
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
            attendances: true,
          },
        },
      },
    });

    // Calculate overall attendance statistics
    let totalSessionsCount = 0;
    let totalExpectedAttendances = 0;
    let totalActualAttendances = 0;

    for (const scheduleSession of allScheduleSessions) {
      const totalStudentsInClass = scheduleSession.schedule.class.students.length;
      if (totalStudentsInClass > 0) {
        totalSessionsCount++;
        totalExpectedAttendances += totalStudentsInClass;
        
        const attendedStudentsSet = new Set(
          scheduleSession.sessions.flatMap((session) =>
            session.attendances.map((att) => att.studentId)
          )
        );
        totalActualAttendances += attendedStudentsSet.size;
      }
    }

    const overallAttendanceRate =
      totalExpectedAttendances > 0
        ? ((totalActualAttendances / totalExpectedAttendances) * 100).toFixed(2)
        : '0.00';

    const overallAbsentRate = (100 - parseFloat(overallAttendanceRate)).toFixed(2);

    res.json({
      overview: {
        totalClasses,
        totalStudents,
        totalLecturers,
        totalSessions: totalSessionsCount,
        overallAttendanceRate: parseFloat(overallAttendanceRate),
        overallAbsentRate: parseFloat(overallAbsentRate),
      },
      details: {
        totalExpectedAttendances,
        totalActualAttendances,
        totalMissedAttendances: totalExpectedAttendances - totalActualAttendances,
      },
    });
  } catch (error: any) {
    console.error('Get admin overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get weekly attendance statistics for admin dashboard
 * GET /api/statistics/admin/weekly
 */
export const getWeeklyStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, period } = req.query;

    let start: Date;
    let end: Date = new Date();

    if (period === 'current-week') {
      // Get current week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(end.getDate() + 6); // Sunday
      end.setHours(23, 59, 59, 999);
    } else if (period === 'last-week') {
      // Get last week (Monday to Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // This Monday
      start = new Date(now.setDate(diff - 7)); // Last Monday
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(end.getDate() + 6); // Last Sunday
      end.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {
      // Custom date range
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      // Default: last 4 weeks
      end = new Date();
      start = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000); // 4 weeks ago
    }

    // Get all schedule sessions in the date range
    const scheduleSessions = await prisma.scheduleSession.findMany({
      where: {
        sessionDate: {
          gte: start,
          lte: end,
        },
      },
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
            attendances: true,
          },
        },
      },
      orderBy: {
        sessionDate: 'asc',
      },
    });

    // Group by week
    interface WeeklyData {
      [key: string]: {
        weekStart: Date;
        weekEnd: Date;
        totalSessions: number;
        totalExpected: number;
        totalAttended: number;
        attendanceRate: number;
        absentRate: number;
      };
    }

    const weeklyData: WeeklyData = {};

    for (const scheduleSession of scheduleSessions) {
      const sessionDate = new Date(scheduleSession.sessionDate);
      
      // Get Monday of the week
      const dayOfWeek = sessionDate.getDay();
      const diff = sessionDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(sessionDate.setDate(diff));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart,
          weekEnd,
          totalSessions: 0,
          totalExpected: 0,
          totalAttended: 0,
          attendanceRate: 0,
          absentRate: 0,
        };
      }

      const totalStudentsInClass = scheduleSession.schedule.class.students.length;
      
      if (totalStudentsInClass > 0) {
        weeklyData[weekKey].totalSessions++;
        weeklyData[weekKey].totalExpected += totalStudentsInClass;

        const attendedStudentsSet = new Set(
          scheduleSession.sessions.flatMap((session) =>
            session.attendances.map((att) => att.studentId)
          )
        );
        
        weeklyData[weekKey].totalAttended += attendedStudentsSet.size;
      }
    }

    // Calculate rates for each week
    const weeklyStats = Object.entries(weeklyData)
      .map(([weekKey, data]) => {
        const attendanceRate =
          data.totalExpected > 0
            ? parseFloat(((data.totalAttended / data.totalExpected) * 100).toFixed(2))
            : 0;
        const absentRate = parseFloat((100 - attendanceRate).toFixed(2));

        return {
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          totalSessions: data.totalSessions,
          totalExpected: data.totalExpected,
          totalAttended: data.totalAttended,
          totalAbsent: data.totalExpected - data.totalAttended,
          attendanceRate,
          absentRate,
        };
      })
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    res.json({
      period: {
        startDate: start,
        endDate: end,
      },
      weeklyStats,
    });
  } catch (error: any) {
    console.error('Get weekly stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

