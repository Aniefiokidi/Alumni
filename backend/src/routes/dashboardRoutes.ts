import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * Dashboard routes
 */
router.get('/stats', protect, authorize('admin'), getDashboardStats);

export default router;
