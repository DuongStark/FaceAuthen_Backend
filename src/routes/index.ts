import express from 'express';
import authRoutes from './auth.routes';
import classesRoutes from './classes.routes';
import facesRoutes from './faces.routes';
import sessionsRoutes from './sessions.routes';
import attendanceRoutes from './attendance.routes';
import scheduleRoutes from './schedule.routes';
import statisticsRoutes from './statistics.routes';
import notificationRoutes from './notification.routes';
import faceImagesRoutes from './faceImages.routes';
import ipConfigRoutes from './ipConfig.routes';
import studentsRoutes from './students.routes';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/classes', classesRoutes);
router.use('/faces', facesRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ip-config', ipConfigRoutes);
router.use('/students', studentsRoutes);

// Admin routes
router.use('/api/admin/face-images', faceImagesRoutes);

export default router;
