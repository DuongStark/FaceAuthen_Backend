import express from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *         email:
 *           type: string
 *         displayName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [lecturer, student, admin]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký user mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [lecturer, student, admin]
 *                 example: student
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 uid:
 *                   type: string
 *                   example: 550e8400-e29b-41d4-a716-446655440000
 *             example:
 *               message: User registered successfully
 *               uid: 550e8400-e29b-41d4-a716-446655440000
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Email already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: lecturer@uni.edu
 *               password:
 *                 type: string
 *                 example: lecturer123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *                 studentInfo:
 *                   type: array
 *                   items:
 *                     type: object
 *             example:
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 uid: 550e8400-e29b-41d4-a716-446655440000
 *                 email: lecturer@uni.edu
 *                 displayName: Dr. Smith
 *                 role: lecturer
 *               studentInfo: []
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin user hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                 studentInfo:
 *                   type: array
 *                   items:
 *                     type: object
 *             example:
 *               user:
 *                 uid: 550e8400-e29b-41d4-a716-446655440000
 *                 email: annv.b21dccn001@stu.ptit.edu.vn
 *                 displayName: Nguyễn Văn An
 *                 role: student
 *                 createdAt: "2024-01-15T10:30:00.000Z"
 *               studentInfo:
 *                 - id: abc-123
 *                   studentId: B21DCCN001
 *                   name: Nguyễn Văn An
 *                   email: annv.b21dccn001@stu.ptit.edu.vn
 *                   class:
 *                     id: class-xyz
 *                     name: Lập trình web
 *                     code: IT4409
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               error: Unauthorized
 */
router.get('/me', requireAuth, me);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', requireAuth, logout);

export default router;
