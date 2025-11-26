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
 * Create a new class
 * POST /classes
 */
export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description } = req.body;
    const lecturerId = req.user?.uid;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    if (!lecturerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const newClass = await prisma.class.create({
      data: {
        lecturerId,
        name,
        code,
        description,
      },
    });

    res.status(201).json({
      message: 'Class created successfully',
      class: {
        id: newClass.id,
        name: newClass.name,
        code: newClass.code,
        description: newClass.description,
        lecturerId: newClass.lecturerId,
      },
    });
  } catch (error: any) {
    console.error('Create class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all classes for current user
 * GET /classes
 */
export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let classes;

    if (userRole === 'lecturer' || userRole === 'admin') {
      // Lecturer: get their classes
      classes = await prisma.class.findMany({
        where: { lecturerId: userId },
        include: {
          lecturer: {
            select: {
              displayName: true,
            },
          },
          schedules: {
            select: {
              id: true,
              name: true,
              room: true,
              startTime: true,
              endTime: true,
              daysOfWeek: true,
              startDate: true,
              endDate: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Get latest schedule
          },
          _count: {
            select: {
              students: true,
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Format response
      classes = classes.map((cls: any) => ({
        ...cls,
        lecturerName: cls.lecturer.displayName,
        room: cls.schedules[0]?.room || null,
        startTime: cls.schedules[0]?.startTime || null,
        endTime: cls.schedules[0]?.endTime || null,
        latestSchedule: cls.schedules[0] || null,
      }));
    } else {
      // Student: get classes they belong to
      const studentRecords = await prisma.student.findMany({
        where: {
          email: req.user?.email,
        },
        include: {
          class: {
            include: {
              lecturer: {
                select: {
                  displayName: true,
                },
              },
              schedules: {
                select: {
                  id: true,
                  name: true,
                  room: true,
                  startTime: true,
                  endTime: true,
                  daysOfWeek: true,
                  startDate: true,
                  endDate: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 1,
              },
              _count: {
                select: {
                  students: true,
                  sessions: true,
                },
              },
            },
          },
        },
      });

      classes = studentRecords.map((s: any) => ({
        ...s.class,
        lecturerName: s.class.lecturer.displayName,
        room: s.class.schedules[0]?.room || null,
        startTime: s.class.schedules[0]?.startTime || null,
        endTime: s.class.schedules[0]?.endTime || null,
        latestSchedule: s.class.schedules[0] || null,
      }));
    }

    res.json(classes);
  } catch (error: any) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get single class by ID
 * GET /classes/:id
 */
export const getClass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        lecturer: {
          select: {
            uid: true,
            displayName: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classData);
  } catch (error: any) {
    console.error('Get class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update class
 * PUT /classes/:id
 */
export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;
    const userId = req.user?.uid;

    // Check if class exists and user is the lecturer
    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classData.lecturerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this class' });
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        code,
        description,
      },
    });

    res.json({
      message: 'Class updated successfully',
      class: updatedClass,
    });
  } catch (error: any) {
    console.error('Update class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete class
 * DELETE /classes/:id
 */
export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    // Check if class exists and user is the lecturer
    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classData.lecturerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this class' });
    }

    await prisma.class.delete({
      where: { id },
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error: any) {
    console.error('Delete class error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add students to class via CSV
 * POST /classes/:id/students/import
 */
export const importStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { students } = req.body; // Array of {studentId, name, email}

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Students array is required' });
    }

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Bulk create students
    const createdStudents = await prisma.student.createMany({
      data: students.map((s: any) => ({
        classId: id,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({
      message: 'Students imported successfully',
      count: createdStudents.count,
    });
  } catch (error: any) {
    console.error('Import students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
