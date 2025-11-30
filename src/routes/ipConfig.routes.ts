import { Router } from 'express';
import { authenticate, requireLecturer } from '../middlewares/auth.middleware';
import {
  getAllowedIPs,
  getActiveAllowedIPs,
  getAllowedIPById,
  createAllowedIP,
  updateAllowedIP,
  deleteAllowedIP,
  toggleAllowedIPStatus,
  bulkCreateAllowedIPs,
  getIPConfig,
  updateIPConfig,
  toggleIPCheck,
  getCurrentIP,
} from '../controllers/ipConfig.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AllowedIP:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         ipAddress:
 *           type: string
 *           example: "192.168.1.1"
 *         type:
 *           type: string
 *           enum: [SINGLE, RANGE]
 *           example: "SINGLE"
 *         description:
 *           type: string
 *           example: "Wifi tầng 1"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     IPConfig:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         enabled:
 *           type: boolean
 *           example: true
 *         errorMessage:
 *           type: string
 *           example: "Bạn chỉ có thể điểm danh khi sử dụng wifi của trường"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateAllowedIP:
 *       type: object
 *       required:
 *         - ipAddress
 *       properties:
 *         ipAddress:
 *           type: string
 *           example: "192.168.1.1"
 *         type:
 *           type: string
 *           enum: [SINGLE, RANGE]
 *           default: "SINGLE"
 *         description:
 *           type: string
 *           example: "Wifi phòng lab"
 *         isActive:
 *           type: boolean
 *           default: true
 *     BulkCreateAllowedIPs:
 *       type: object
 *       required:
 *         - ips
 *       properties:
 *         ips:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreateAllowedIP'
 *     UpdateIPConfig:
 *       type: object
 *       properties:
 *         enabled:
 *           type: boolean
 *         errorMessage:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   - name: IP Config
 *     description: Quản lý cấu hình IP được phép điểm danh (Lecturer/Admin)
 */

// ==================== Public routes ====================

/**
 * @swagger
 * /ip-config/current-ip:
 *   get:
 *     summary: Lấy IP hiện tại của client
 *     tags: [IP Config]
 *     responses:
 *       200:
 *         description: Thông tin IP client
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rawIp:
 *                       type: string
 *                     cleanIp:
 *                       type: string
 *                     isAllowed:
 *                       type: boolean
 *                     headers:
 *                       type: object
 */
router.get('/current-ip', getCurrentIP);

// ==================== Protected routes (Lecturer/Admin) ====================

/**
 * @swagger
 * /ip-config/allowed-ips:
 *   get:
 *     summary: Lấy tất cả IP được phép
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách IP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AllowedIP'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Lecturer/Admin only
 */
router.get('/allowed-ips', authenticate, requireLecturer, getAllowedIPs);

/**
 * @swagger
 * /ip-config/allowed-ips/active:
 *   get:
 *     summary: Lấy các IP đang active
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách IP đang active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AllowedIP'
 */
router.get('/allowed-ips/active', authenticate, requireLecturer, getActiveAllowedIPs);

/**
 * @swagger
 * /ip-config/allowed-ips/{id}:
 *   get:
 *     summary: Lấy IP theo ID
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của allowed IP
 *     responses:
 *       200:
 *         description: Thông tin IP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AllowedIP'
 *       404:
 *         description: IP not found
 */
router.get('/allowed-ips/:id', authenticate, requireLecturer, getAllowedIPById);

/**
 * @swagger
 * /ip-config/allowed-ips:
 *   post:
 *     summary: Thêm IP mới
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAllowedIP'
 *           examples:
 *             single:
 *               summary: IP đơn lẻ
 *               value:
 *                 ipAddress: "203.162.10.1"
 *                 type: "SINGLE"
 *                 description: "Wifi lobby"
 *             range:
 *               summary: Dải IP (CIDR)
 *               value:
 *                 ipAddress: "192.168.1.0/24"
 *                 type: "RANGE"
 *                 description: "Phòng máy tầng 2"
 *     responses:
 *       201:
 *         description: IP created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AllowedIP'
 *       400:
 *         description: Invalid IP format
 *       409:
 *         description: IP already exists
 */
router.post('/allowed-ips', authenticate, requireLecturer, createAllowedIP);

/**
 * @swagger
 * /ip-config/allowed-ips/bulk:
 *   post:
 *     summary: Thêm nhiều IP cùng lúc
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkCreateAllowedIPs'
 *           example:
 *             ips:
 *               - ipAddress: "203.162.10.1"
 *                 type: "SINGLE"
 *                 description: "Wifi tầng 1"
 *               - ipAddress: "203.162.10.2"
 *                 type: "SINGLE"
 *                 description: "Wifi tầng 2"
 *               - ipAddress: "10.0.0.0/8"
 *                 type: "RANGE"
 *                 description: "Mạng nội bộ"
 *     responses:
 *       201:
 *         description: Bulk operation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AllowedIP'
 *                     skipped:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/allowed-ips/bulk', authenticate, requireLecturer, bulkCreateAllowedIPs);

/**
 * @swagger
 * /ip-config/allowed-ips/{id}:
 *   put:
 *     summary: Cập nhật IP
 *     tags: [IP Config]
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
 *             properties:
 *               ipAddress:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [SINGLE, RANGE]
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: IP updated
 *       404:
 *         description: IP not found
 *       409:
 *         description: IP already exists
 */
router.put('/allowed-ips/:id', authenticate, requireLecturer, updateAllowedIP);

/**
 * @swagger
 * /ip-config/allowed-ips/{id}/toggle:
 *   patch:
 *     summary: Bật/Tắt IP (toggle active status)
 *     tags: [IP Config]
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
 *         description: IP status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AllowedIP'
 *       404:
 *         description: IP not found
 */
router.patch('/allowed-ips/:id/toggle', authenticate, requireLecturer, toggleAllowedIPStatus);

/**
 * @swagger
 * /ip-config/allowed-ips/{id}:
 *   delete:
 *     summary: Xóa IP
 *     tags: [IP Config]
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
 *         description: IP deleted
 *       404:
 *         description: IP not found
 */
router.delete('/allowed-ips/:id', authenticate, requireLecturer, deleteAllowedIP);

/**
 * @swagger
 * /ip-config/config:
 *   get:
 *     summary: Lấy cấu hình IP check
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: IP config
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/IPConfig'
 */
router.get('/config', authenticate, requireLecturer, getIPConfig);

/**
 * @swagger
 * /ip-config/config:
 *   put:
 *     summary: Cập nhật cấu hình IP check
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateIPConfig'
 *           example:
 *             enabled: true
 *             errorMessage: "Vui lòng kết nối wifi trường để điểm danh"
 *     responses:
 *       200:
 *         description: Config updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/IPConfig'
 */
router.put('/config', authenticate, requireLecturer, updateIPConfig);

/**
 * @swagger
 * /ip-config/config/toggle:
 *   patch:
 *     summary: Bật/Tắt tính năng kiểm tra IP
 *     tags: [IP Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: IP check toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "IP check disabled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/IPConfig'
 */
router.patch('/config/toggle', authenticate, requireLecturer, toggleIPCheck);

export default router;
