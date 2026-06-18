import { Response } from 'express';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { generateReplyDraft } from '../services/aiService';
import { publishNotification } from '../services/notificationService';

/**
 * Send message
 * @route POST /api/messages
 * @access Private
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { receiver, subject, message } = req.body;

    const newMessage = await Message.create({
      sender: req.user?._id,
      receiver,
      subject,
      message
    });

    publishNotification(String(receiver), {
      type: 'message:new',
      title: 'New message received',
      body: `${req.user?.name || 'An alumni'} sent you a message: ${subject}`,
      metadata: {
        messageId: newMessage._id.toString(),
        subject,
        senderId: req.user?._id?.toString()
      }
    });

    return sendSuccess(res, 201, 'Message sent successfully', { message: newMessage });
  } catch (error: any) {
    return sendError(res, 500, 'Error sending message', error);
  }
};

/**
 * Get received messages
 * @route GET /api/messages/received
 * @access Private
 */
export const getReceivedMessages = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const messages = await Message.find({ receiver: req.user?._id })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Messages retrieved successfully', { messages });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving messages', error);
  }
};

/**
 * Get sent messages
 * @route GET /api/messages/sent
 * @access Private
 */
export const getSentMessages = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const messages = await Message.find({ sender: req.user?._id })
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Sent messages retrieved successfully', { messages });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving sent messages', error);
  }
};

/**
 * Get message by ID
 * @route GET /api/messages/:id
 * @access Private
 */
export const getMessageById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    // Check if user is sender or receiver
    const userId = req.user?._id.toString();
    const senderId = message.sender._id.toString();
    const receiverId = message.receiver._id.toString();

    if (userId !== senderId && userId !== receiverId) {
      return sendError(res, 403, 'Not authorized to view this message');
    }

    // Mark as read if receiver
    if (userId === receiverId && !message.isRead) {
      message.isRead = true;
      await message.save();
      await Notification.updateMany(
        {
          user: req.user?._id,
          type: 'message:new',
          isRead: false,
          'metadata.messageId': message._id.toString()
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );
    }

    return sendSuccess(res, 200, 'Message retrieved successfully', { message });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving message', error);
  }
};

/**
 * Delete message
 * @route DELETE /api/messages/:id
 * @access Private
 */
export const deleteMessage = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    // Check if user is sender or receiver
    const userId = req.user?._id.toString();
    const senderId = message.sender.toString();
    const receiverId = message.receiver.toString();

    if (userId !== senderId && userId !== receiverId) {
      return sendError(res, 403, 'Not authorized to delete this message');
    }

    await message.deleteOne();

    return sendSuccess(res, 200, 'Message deleted successfully', {});
  } catch (error: any) {
    return sendError(res, 500, 'Error deleting message', error);
  }
};

/**
 * Get unread message count
 * @route GET /api/messages/unread/count
 * @access Private
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user?._id,
      isRead: false
    });

    return sendSuccess(res, 200, 'Unread count retrieved successfully', { count });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving unread count', error);
  }
};

/**
 * Suggest professional reply draft
 * @route POST /api/messages/:id/suggest-reply
 * @access Private
 */
export const suggestReplyDraft = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    if (!message) {
      return sendError(res, 404, 'Message not found');
    }

    const userId = req.user?._id.toString();
    const senderId = message.sender._id.toString();
    const receiverId = message.receiver._id.toString();

    if (userId !== senderId && userId !== receiverId) {
      return sendError(res, 403, 'Not authorized to generate a draft for this message');
    }

    const { tone, maxWords } = req.body || {};
    const result = await generateReplyDraft(message, userId || '', { tone, maxWords });

    return sendSuccess(res, 200, 'Reply draft generated successfully', {
      draft: result.draft,
      appliedTone: result.appliedTone,
      detectedIntent: result.detectedIntent,
      detectedTone: result.detectedTone,
      conversationTone: result.conversationTone,
      classificationSource: result.classificationSource,
      styleExampleCount: result.styleExampleCount,
      source: result.source
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error generating reply draft', error);
  }
};
