import express from 'express';
import {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  importStudents,
} from '../controllers/classes.controller';
import { importStudentsFromCSV } from '../controllers/csv.controller';
import { requireAuth, requireLecturer } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lập trình web
 *               code:
 *                 type: string
 *                 example: IT4409
 *               description:
 *                 type: string
 *                 example: Môn học lập trình web cho sinh viên năm 3
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Class created successfully
 *               id: class-uuid-123
 */
router.post('/', requireAuth, requireLecturer, createClass);

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes for current user
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             example:
 *               - id: class-uuid-123
 *                 name: Lập trình web
 *                 code: IT4409
 *                 description: Môn học lập trình web
 *                 lecturerId: lecturer-uuid
 *                 _count:
 *                   students: 40
 *                   sessions: 5
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 */
router.get('/', requireAuth, getClasses);

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get single class by ID
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: class-uuid-123
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             example:
 *               id: class-uuid-123
 *               name: Lập trình web
 *               code: IT4409
 *               description: Môn học lập trình web
 *               lecturerId: lecturer-uuid
 *               students:
 *                 - id: student-uuid-1
 *                   studentId: B21DCCN001
 *                   name: Nguyễn Văn An
 *                   email: annv.b21dccn001@stu.ptit.edu.vn
 *               _count:
 *                 students: 40
 *                 sessions: 5
 *       404:
 *         description: Class not found
 *         content:
 *           application/json:
 *             example:
 *               error: Class not found
 */
router.get('/:id', getClass);

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated
 */
router.put('/:id', requireAuth, requireLecturer, updateClass);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class deleted
 */
router.delete('/:id', requireAuth, requireLecturer, deleteClass);

/**
 * @swagger
 * /classes/{id}/students/import:
 *   post:
 *     summary: Import students to class via CSV
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - students
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *     responses:
 *       201:
 *         description: Students imported
 */
router.post('/:id/students/import', requireAuth, requireLecturer, importStudents);

export default router;
