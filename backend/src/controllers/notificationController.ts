import { Response } from 'express';
import Message from '../models/Message';
import MentorshipRequest from '../models/MentorshipRequest';
import Notification from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import { addNotificationClient, removeNotificationClient } from '../services/notificationService';
import { sendError, sendSuccess } from '../utils/response';

export const getNotificationSummary = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;

    const [unreadMessages, pendingMentorshipRequests, unreadNotifications] = await Promise.all([
      Message.countDocuments({ receiver: userId, isRead: false }),
      MentorshipRequest.countDocuments({ mentor: userId, status: 'pending' }),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

    return sendSuccess(res, 200, 'Notification summary retrieved successfully', {
      unreadMessages,
      pendingMentorshipRequests,
      unreadNotifications
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving notification summary', error);
  }
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { unread } = req.query;
    const query: Record<string, unknown> = {
      user: req.user?._id
    };

    if (unread === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return sendSuccess(res, 200, 'Notifications retrieved successfully', {
      notifications
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving notifications', error);
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user?._id
      },
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    return sendSuccess(res, 200, 'Notification marked as read', { notification });
  } catch (error: any) {
    return sendError(res, 500, 'Error marking notification as read', error);
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    await Notification.updateMany(
      {
        user: req.user?._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return sendSuccess(res, 200, 'All notifications marked as read', {});
  } catch (error: any) {
    return sendError(res, 500, 'Error marking all notifications as read', error);
  }
};

export const streamNotifications = async (req: AuthRequest, res: Response): Promise<void | Response> => {
  if (!req.user?._id) {
    return sendError(res, 401, 'Not authorized');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const userId = req.user._id.toString();
  const clientId = addNotificationClient(userId, res);

  req.on('close', () => {
    removeNotificationClient(userId, clientId);
    res.end();
  });
};
