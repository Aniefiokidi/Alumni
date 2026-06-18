import express from 'express';
import {
  sendMessage,
  getReceivedMessages,
  getSentMessages,
  getMessageById,
  deleteMessage,
  getUnreadCount,
  suggestReplyDraft
} from '../controllers/messageController';
import { protect } from '../middleware/auth';
import { messageValidation, messageReplyDraftValidation } from '../middleware/validation';

const router = express.Router();

/**
 * Message routes
 */
router.post('/', protect, messageValidation, sendMessage);
router.get('/received', protect, getReceivedMessages);
router.get('/sent', protect, getSentMessages);
router.get('/unread/count', protect, getUnreadCount);
router.post('/:id/suggest-reply', protect, messageReplyDraftValidation, suggestReplyDraft);
router.get('/:id', protect, getMessageById);
router.delete('/:id', protect, deleteMessage);

export default router;
