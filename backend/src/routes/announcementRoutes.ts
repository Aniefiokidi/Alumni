import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController';
import { protect, authorize } from '../middleware/auth';
import { announcementValidation } from '../middleware/validation';

const router = express.Router();

/**
 * Announcement routes
 */
router.post('/', protect, authorize('admin'), announcementValidation, createAnnouncement);
router.get('/', protect, getAnnouncements);
router.get('/:id', protect, getAnnouncementById);
router.put('/:id', protect, authorize('admin'), updateAnnouncement);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncement);

export default router;
