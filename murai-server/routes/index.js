import express from 'express';
import adminRoutes from './admin/index.js';
import authRoutes from './authRoutes.js';
import homeStatsRoutes from './homeStatsRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import userRoutes from './user/index.js';

const router = express.Router();

// Authentication routes (shared)
router.use('/auth', authRoutes);

// Notification routes (shared)
router.use('/notifications', notificationRoutes);

// Home stats routes (shared)
router.use('/api', homeStatsRoutes);

// User-specific routes
router.use('/', userRoutes);

// Admin-specific routes
router.use('/', adminRoutes);

export default router;
