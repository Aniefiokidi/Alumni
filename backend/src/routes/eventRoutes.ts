import express from 'express';
import {
  cancelRsvp,
  checkInEventAttendee,
  createEvent,
  deleteEvent,
  getEventAttendance,
  getEventById,
  getEvents,
  getMyRsvps,
  regenerateEventBanner,
  rsvpEvent,
  updateEvent
} from '../controllers/eventController';
import { protect, authorize } from '../middleware/auth';
import { eventValidation } from '../middleware/validation';

const router = express.Router();

/**
 * Event routes
 */
router.post('/', protect, eventValidation, createEvent);
router.get('/', protect, getEvents);
router.get('/my-rsvps', protect, getMyRsvps);
router.get('/:id', protect, getEventById);
router.get('/:id/attendance', protect, getEventAttendance);
router.put('/:id', protect, authorize('admin'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);
router.post('/:id/rsvp', protect, rsvpEvent);
router.delete('/:id/rsvp', protect, cancelRsvp);
router.patch('/:id/attendance/:userId/check-in', protect, checkInEventAttendee);
router.post('/:id/regenerate-banner', protect, regenerateEventBanner);

export default router;
