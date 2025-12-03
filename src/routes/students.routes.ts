import express from 'express';
import {
  getAllStudents,
  getStudentsByClassId,
  getStudentById,
  getStudentByClassAndStudentId,
} from '../controllers/students.controller';
import { requireAuth, requireLecturer } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentFaceImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: UUID của face image
 *         imageUrl:
 *           type: string
 *           description: URL ảnh từ Cloudinary
 *         publicId:
 *           type: string
 *           description: Cloudinary public_id
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     StudentDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: UUID của student record
 *         studentId:
 *           type: string
 *           description: Mã sinh viên (VD D23DCCN001)
 *         name:
 *           type: string
 *           description: Họ tên sinh viên
 *         email:
 *           type: string
 *           description: Email sinh viên
 *         classId:
 *           type: string
 *           description: UUID của lớp học
 *         class:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             code:
 *               type: string
 *             description:
 *               type: string
 *             lecturer:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                 displayName:
 *                   type: string
 *                 email:
 *                   type: string
 *         faceImage:
 *           $ref: '#/components/schemas/StudentFaceImage'
 *         faceDescriptorsCount:
 *           type: integer
 *           description: Số lượng face descriptors
 *         hasFaceDescriptor:
 *           type: boolean
 *           description: Đã có face descriptor chưa
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Lấy danh sách tất cả sinh viên (có phân trang)
 *     tags: [Students]
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
 *           default: 20
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mã sinh viên hoặc email
 *     responses:
 *       200:
 *         description: Danh sách sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentDetail'
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
 *             example:
 *               data:
 *                 - id: "uuid-123"
 *                   studentId: "D23DCCN001"
 *                   name: "Nguyễn Văn An"
 *                   email: "d23dccn001@stu.ptit.edu.vn"
 *                   classId: "class-uuid"
 *                   class:
 *                     id: "class-uuid"
 *                     name: "Lập trình web"
 *                     code: "IT4409"
 *                     description: "Môn học lập trình web"
 *                     lecturer:
 *                       uid: "lecturer-uuid"
 *                       displayName: "Dr. Nguyen Van B"
 *                       email: "lecturer@uni.edu"
 *                   faceImage:
 *                     id: "face-image-uuid"
 *                     imageUrl: "https://res.cloudinary.com/..."
 *                     publicId: "face_images/abc123"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                   faceDescriptorsCount: 1
 *                   hasFaceDescriptor: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 20
 *                 total: 100
 *                 totalPages: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ lecturer/admin mới có quyền
 */
router.get('/', requireAuth, requireLecturer, getAllStudents);

/**
 * @swagger
 * /students/class/{classId}:
 *   get:
 *     summary: Lấy danh sách sinh viên theo lớp học
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của lớp học
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
 *           default: 50
 *         description: Số lượng kết quả mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên, mã sinh viên hoặc email
 *     responses:
 *       200:
 *         description: Danh sách sinh viên trong lớp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 class:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     lecturer:
 *                       type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       studentId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       faceImage:
 *                         $ref: '#/components/schemas/StudentFaceImage'
 *                       faceDescriptorsCount:
 *                         type: integer
 *                       hasFaceDescriptor:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                 pagination:
 *                   type: object
 *             example:
 *               class:
 *                 id: "class-uuid"
 *                 name: "Lập trình web"
 *                 code: "IT4409"
 *                 description: "Môn học lập trình web"
 *                 lecturer:
 *                   uid: "lecturer-uuid"
 *                   displayName: "Dr. Nguyen Van B"
 *                   email: "lecturer@uni.edu"
 *               data:
 *                 - id: "uuid-123"
 *                   studentId: "D23DCCN001"
 *                   name: "Nguyễn Văn An"
 *                   email: "d23dccn001@stu.ptit.edu.vn"
 *                   faceImage:
 *                     id: "face-image-uuid"
 *                     imageUrl: "https://res.cloudinary.com/..."
 *                     publicId: "face_images/abc123"
 *                     createdAt: "2024-01-15T10:30:00.000Z"
 *                     updatedAt: "2024-01-15T10:30:00.000Z"
 *                   faceDescriptorsCount: 1
 *                   hasFaceDescriptor: true
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *               pagination:
 *                 page: 1
 *                 limit: 50
 *                 total: 40
 *                 totalPages: 1
 *       404:
 *         description: Class not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ lecturer/admin mới có quyền
 */
router.get('/class/:classId', requireAuth, requireLecturer, getStudentsByClassId);

/**
 * @swagger
 * /students/class/{classId}/student/{studentId}:
 *   get:
 *     summary: Lấy thông tin sinh viên theo classId và mã sinh viên
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của lớp học
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã sinh viên (VD D23DCCN001)
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/StudentDetail'
 *             example:
 *               data:
 *                 id: "uuid-123"
 *                 studentId: "D23DCCN001"
 *                 name: "Nguyễn Văn An"
 *                 email: "d23dccn001@stu.ptit.edu.vn"
 *                 classId: "class-uuid"
 *                 class:
 *                   id: "class-uuid"
 *                   name: "Lập trình web"
 *                   code: "IT4409"
 *                   description: "Môn học lập trình web"
 *                   lecturer:
 *                     uid: "lecturer-uuid"
 *                     displayName: "Dr. Nguyen Van B"
 *                     email: "lecturer@uni.edu"
 *                 faceImage:
 *                   id: "face-image-uuid"
 *                   imageUrl: "https://res.cloudinary.com/..."
 *                   publicId: "face_images/abc123"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 faceDescriptorsCount: 1
 *                 hasFaceDescriptor: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Class or Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ lecturer/admin mới có quyền
 */
router.get('/class/:classId/student/:studentId', requireAuth, requireLecturer, getStudentByClassAndStudentId);

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Lấy thông tin sinh viên theo UUID
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID của student record
 *     responses:
 *       200:
 *         description: Thông tin chi tiết sinh viên
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/StudentDetail'
 *             example:
 *               data:
 *                 id: "uuid-123"
 *                 studentId: "D23DCCN001"
 *                 name: "Nguyễn Văn An"
 *                 email: "d23dccn001@stu.ptit.edu.vn"
 *                 classId: "class-uuid"
 *                 class:
 *                   id: "class-uuid"
 *                   name: "Lập trình web"
 *                   code: "IT4409"
 *                   description: "Môn học lập trình web"
 *                   lecturer:
 *                     uid: "lecturer-uuid"
 *                     displayName: "Dr. Nguyen Van B"
 *                     email: "lecturer@uni.edu"
 *                 faceImage:
 *                   id: "face-image-uuid"
 *                   imageUrl: "https://res.cloudinary.com/..."
 *                   publicId: "face_images/abc123"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *                   updatedAt: "2024-01-15T10:30:00.000Z"
 *                 faceDescriptorsCount: 1
 *                 hasFaceDescriptor: true
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *                 updatedAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Student not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Chỉ lecturer/admin mới có quyền
 */
router.get('/:id', requireAuth, requireLecturer, getStudentById);

export default router;

