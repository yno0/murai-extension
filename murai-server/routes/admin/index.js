import express from 'express';
import adminRoutes from './adminRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const router = express.Router();

// Admin-specific routes
router.use('/admin', adminRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
