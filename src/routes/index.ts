import express from 'express';
import authRoutes from './auth.routes';
import classesRoutes from './classes.routes';
import facesRoutes from './faces.routes';
import sessionsRoutes from './sessions.routes';
import attendanceRoutes from './attendance.routes';
import scheduleRoutes from './schedule.routes';
import statisticsRoutes from './statistics.routes';

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/classes', classesRoutes);
router.use('/faces', facesRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/statistics', statisticsRoutes);

export default router;
