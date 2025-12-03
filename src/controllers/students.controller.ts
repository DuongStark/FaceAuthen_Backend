import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

// Helper function to format student response with full info
const formatStudentResponse = (student: any) => ({
  id: student.id,
  studentId: student.studentId,
  name: student.name,
  email: student.email,
  classId: student.classId,
  class: student.class ? {
    id: student.class.id,
    name: student.class.name,
    code: student.class.code,
    description: student.class.description,
    lecturer: student.class.lecturer ? {
      uid: student.class.lecturer.uid,
      displayName: student.class.lecturer.displayName,
      email: student.class.lecturer.email,
    } : null,
  } : null,
  faceImage: student.faceImage ? {
    id: student.faceImage.id,
    imageUrl: student.faceImage.imageUrl,
    publicId: student.faceImage.publicId,
    createdAt: student.faceImage.createdAt,
    updatedAt: student.faceImage.updatedAt,
  } : null,
  faceDescriptorsCount: student.faceDescriptors?.length || 0,
  hasFaceDescriptor: (student.faceDescriptors?.length || 0) > 0,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
});

// Include options for Prisma queries
const studentInclude = {
  class: {
    include: {
      lecturer: {
        select: {
          uid: true,
          displayName: true,
          email: true,
        },
      },
    },
  },
  faceImage: true,
  faceDescriptors: {
    select: {
      id: true,
    },
  },
};

/**
 * Get all students
 * GET /students
 */
export const getAllStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { studentId: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get students with pagination
    const students = await prisma.student.findMany({
      where,
      include: studentInclude,
      skip,
      take: limitNum,
      orderBy: [
        { class: { name: 'asc' } },
        { studentId: 'asc' },
      ],
    });

    res.json({
      data: students.map(formatStudentResponse),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get all students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get students by class ID
 * GET /students/class/:classId
 */
export const getStudentsByClassId = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const { page = '1', limit = '50', search } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        lecturer: {
          select: {
            uid: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Build where clause
    const where: any = { classId };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { studentId: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.student.count({ where });

    // Get students
    const students = await prisma.student.findMany({
      where,
      include: {
        faceImage: true,
        faceDescriptors: {
          select: {
            id: true,
          },
        },
      },
      skip,
      take: limitNum,
      orderBy: { studentId: 'asc' },
    });

    res.json({
      class: {
        id: classData.id,
        name: classData.name,
        code: classData.code,
        description: classData.description,
        lecturer: classData.lecturer,
      },
      data: students.map((student) => ({
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        faceImage: student.faceImage ? {
          id: student.faceImage.id,
          imageUrl: student.faceImage.imageUrl,
          publicId: student.faceImage.publicId,
          createdAt: student.faceImage.createdAt,
          updatedAt: student.faceImage.updatedAt,
        } : null,
        faceDescriptorsCount: student.faceDescriptors?.length || 0,
        hasFaceDescriptor: (student.faceDescriptors?.length || 0) > 0,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get students by class ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get student by UUID (internal ID)
 * GET /students/:id
 */
export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: studentInclude,
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      data: formatStudentResponse(student),
    });
  } catch (error: any) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get student by class ID and student ID (mã sinh viên)
 * GET /students/class/:classId/student/:studentId
 */
export const getStudentByClassAndStudentId = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, studentId } = req.params;

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const student = await prisma.student.findFirst({
      where: {
        classId,
        studentId,
      },
      include: studentInclude,
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found in this class' });
    }

    res.json({
      data: formatStudentResponse(student),
    });
  } catch (error: any) {
    console.error('Get student by class and student ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

