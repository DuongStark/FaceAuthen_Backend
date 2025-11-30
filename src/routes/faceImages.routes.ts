import express from 'express';
import multer from 'multer';
import { requireAuth, requireLecturer } from '../middlewares/auth.middleware';
import {
  createFaceImage,
  getAllFaceImages,
  getFaceImageById,
  getFaceImageByStudentId,
  updateFaceImage,
  deleteFaceImage,
} from '../controllers/faceImages.controller';

const router = express.Router();

// Cấu hình multer để xử lý file upload (lưu vào memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     FaceImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: UUID của face image
 *         studentId:
 *           type: string
 *           description: UUID của student
 *         imageUrl:
 *           type: string
 *           description: URL ảnh trên Cloudinary
 *         publicId:
 *           type: string
 *           description: Public ID trên Cloudinary
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         student:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             studentId:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 */

/**
 * @swagger
 * /api/admin/face-images:
 *   post:
 *     summary: Upload ảnh khuôn mặt mới cho student
 *     tags: [Admin - Face Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - image
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: UUID của student
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh (jpg, png, etc.)
 *     responses:
 *       201:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FaceImage'
 *       400:
 *         description: Missing studentId or image file
 *       404:
 *         description: Student not found
 *       409:
 *         description: Student already has a face image
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/', requireAuth, requireLecturer, upload.single('image'), createFaceImage);

/**
 * @swagger
 * /api/admin/face-images:
 *   get:
 *     summary: Lấy danh sách tất cả ảnh khuôn mặt (có pagination)
 *     tags: [Admin - Face Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách face images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FaceImage'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/', requireAuth, requireLecturer, getAllFaceImages);

/**
 * @swagger
 * /api/admin/face-images/student/{studentId}:
 *   get:
 *     summary: Lấy ảnh khuôn mặt của một student cụ thể
 *     tags: [Admin - Face Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của student
 *     responses:
 *       200:
 *         description: Chi tiết face image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/FaceImage'
 *       404:
 *         description: Student or face image not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/student/:studentId', requireAuth, requireLecturer, getFaceImageByStudentId);

/**
 * @swagger
 * /api/admin/face-images/{id}:
 *   get:
 *     summary: Lấy chi tiết một ảnh khuôn mặt theo ID
 *     tags: [Admin - Face Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của face image
 *     responses:
 *       200:
 *         description: Chi tiết face image
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/FaceImage'
 *       404:
 *         description: Face image not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/:id', requireAuth, requireLecturer, getFaceImageById);

/**
 * @swagger
 * /api/admin/face-images/{id}:
 *   put:
 *     summary: Cập nhật/thay thế ảnh khuôn mặt
 *     tags: [Admin - Face Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của face image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh mới (jpg, png, etc.)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FaceImage'
 *       400:
 *         description: Missing image file
 *       404:
 *         description: Face image not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.put('/:id', requireAuth, requireLecturer, upload.single('image'), updateFaceImage);

/**
 * @swagger
 * /api/admin/face-images/{id}:
 *   delete:
 *     summary: Xóa ảnh khuôn mặt
 *     tags: [Admin - Face Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của face image
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Face image not found
 *       403:
 *         description: Forbidden - Admin only
 */
router.delete('/:id', requireAuth, requireLecturer, deleteFaceImage);

export default router;

