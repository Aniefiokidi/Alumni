import express from 'express';
import {
  createMentorshipRequest,
  createMentorshipSession,
  getMentorMatches,
  getMyMentorshipRequests,
  getMyMentorshipSessions,
  updateMentorshipRequestStatus,
  updateMentorshipSessionStatus
} from '../controllers/mentorshipController';
import { protect } from '../middleware/auth';
import {
  mentorshipRequestValidation,
  mentorshipSessionStatusValidation,
  mentorshipSessionValidation,
  mentorshipStatusValidation
} from '../middleware/validation';

const router = express.Router();

router.get('/matches', protect, getMentorMatches);
router.get('/requests/my', protect, getMyMentorshipRequests);
router.post('/requests', protect, mentorshipRequestValidation, createMentorshipRequest);
router.patch('/requests/:id/status', protect, mentorshipStatusValidation, updateMentorshipRequestStatus);
router.get('/sessions/my', protect, getMyMentorshipSessions);
router.post('/sessions', protect, mentorshipSessionValidation, createMentorshipSession);
router.patch('/sessions/:id/status', protect, mentorshipSessionStatusValidation, updateMentorshipSessionStatus);

export default router;
