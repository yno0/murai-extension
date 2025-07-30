import express from 'express';
import groupActivitiesRoutes from './groupActivitiesRoutes.js';
import userDashboardRoutes from './userDashboardRoutes.js';
import userRoutes from './userRoutes.js';

const router = express.Router();

// User-specific routes
router.use('/users', userRoutes);
router.use('/users', groupActivitiesRoutes);
router.use('/user-dashboard', userDashboardRoutes);

export default router;
