import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadImage, deleteImage } from '../lib/cloudinary';

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

/**
 * Upload ảnh mới cho student
 * POST /api/admin/face-images
 */
export const createFaceImage = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.body;
    const file = req.file;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { faceImage: true },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if student already has a face image
    if (student.faceImage) {
      return res.status(409).json({
        error: 'Student already has a face image. Please update instead.',
        existingImage: student.faceImage,
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(file.buffer, 'face_images');

    // Save to database
    const faceImage = await prisma.faceImage.create({
      data: {
        studentId,
        imageUrl: uploadResult.imageUrl,
        publicId: uploadResult.publicId,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Face image uploaded successfully',
      data: faceImage,
    });
  } catch (error) {
    console.error('Error creating face image:', error);
    res.status(500).json({ error: 'Failed to upload face image' });
  }
};

/**
 * Lấy danh sách tất cả ảnh (có pagination)
 * GET /api/admin/face-images
 */
export const getAllFaceImages = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [faceImages, total] = await Promise.all([
      prisma.faceImage.findMany({
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              name: true,
              email: true,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.faceImage.count(),
    ]);

    res.json({
      data: faceImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching face images:', error);
    res.status(500).json({ error: 'Failed to fetch face images' });
  }
};

/**
 * Lấy chi tiết 1 ảnh theo id
 * GET /api/admin/face-images/:id
 */
export const getFaceImageById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const faceImage = await prisma.faceImage.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
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

    if (!faceImage) {
      return res.status(404).json({ error: 'Face image not found' });
    }

    res.json({ data: faceImage });
  } catch (error) {
    console.error('Error fetching face image:', error);
    res.status(500).json({ error: 'Failed to fetch face image' });
  }
};

/**
 * Lấy ảnh của 1 student cụ thể
 * GET /api/admin/face-images/student/:studentId
 */
export const getFaceImageByStudentId = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const faceImage = await prisma.faceImage.findUnique({
      where: { studentId },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
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

    if (!faceImage) {
      return res.status(404).json({ error: 'Face image not found for this student' });
    }

    res.json({ data: faceImage });
  } catch (error) {
    console.error('Error fetching face image:', error);
    res.status(500).json({ error: 'Failed to fetch face image' });
  }
};

/**
 * Cập nhật/thay thế ảnh
 * PUT /api/admin/face-images/:id
 */
export const updateFaceImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Find existing face image
    const existingFaceImage = await prisma.faceImage.findUnique({
      where: { id },
    });

    if (!existingFaceImage) {
      return res.status(404).json({ error: 'Face image not found' });
    }

    // Delete old image from Cloudinary
    await deleteImage(existingFaceImage.publicId);

    // Upload new image to Cloudinary
    const uploadResult = await uploadImage(file.buffer, 'face_images');

    // Update database
    const updatedFaceImage = await prisma.faceImage.update({
      where: { id },
      data: {
        imageUrl: uploadResult.imageUrl,
        publicId: uploadResult.publicId,
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Face image updated successfully',
      data: updatedFaceImage,
    });
  } catch (error) {
    console.error('Error updating face image:', error);
    res.status(500).json({ error: 'Failed to update face image' });
  }
};

/**
 * Xóa ảnh
 * DELETE /api/admin/face-images/:id
 */
export const deleteFaceImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find existing face image
    const existingFaceImage = await prisma.faceImage.findUnique({
      where: { id },
    });

    if (!existingFaceImage) {
      return res.status(404).json({ error: 'Face image not found' });
    }

    // Delete from Cloudinary
    await deleteImage(existingFaceImage.publicId);

    // Delete from database
    await prisma.faceImage.delete({
      where: { id },
    });

    res.json({ message: 'Face image deleted successfully' });
  } catch (error) {
    console.error('Error deleting face image:', error);
    res.status(500).json({ error: 'Failed to delete face image' });
  }
};

