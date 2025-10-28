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
 * Upload face descriptor cho student
 * POST /api/faces/upload
 */
export const uploadFace = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, descriptor } = req.body;

    if (!studentId || !descriptor) {
      return res.status(400).json({ error: 'StudentId and descriptor are required' });
    }

    if (!Array.isArray(descriptor)) {
      return res.status(400).json({ error: 'Descriptor must be an array' });
    }

    // Verify student exists
    const student = await prisma.student.findFirst({
      where: { studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Create face descriptor
    const faceDescriptor = await prisma.faceDescriptor.create({
      data: {
        studentId: student.id,
        descriptor,
      },
    });

    res.status(201).json({
      message: 'Face descriptor uploaded successfully',
      id: faceDescriptor.id,
    });
  } catch (error: any) {
    console.error('Upload face error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Fetch face gallery cho một class
 * GET /api/faces/gallery/:classId
 */
export const fetchFaceGallery = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        faceDescriptors: {
          select: {
            descriptor: true,
          },
        },
      },
    });

    // Map to response format
    const gallery = students.map((student) => ({
      studentId: student.studentId,
      descriptors: student.faceDescriptors.map((fd) => fd.descriptor),
    }));

    res.json(gallery);
  } catch (error: any) {
    console.error('Fetch face gallery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
