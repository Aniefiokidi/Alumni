import express from 'express';
import {
  getNotificationSummary,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  streamNotifications
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/summary', protect, getNotificationSummary);
router.get('/', protect, getNotifications);
router.patch('/read-all', protect, markAllNotificationsAsRead);
router.patch('/:id/read', protect, markNotificationAsRead);
router.get('/stream', protect, streamNotifications);

export default router;
