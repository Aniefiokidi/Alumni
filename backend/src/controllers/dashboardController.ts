import { Response } from 'express';
import User from '../models/User';
import Event from '../models/Event';
import Donation from '../models/Donation';
import EventRsvp from '../models/EventRsvp';
import MentorshipRequest from '../models/MentorshipRequest';
import MentorshipSession from '../models/MentorshipSession';
import Notification from '../models/Notification';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

/**
 * Get admin dashboard statistics
 * @route GET /api/dashboard/stats
 * @access Private (Admin)
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const now = new Date();

    const [
      totalAlumni,
      donationStats,
      upcomingEvents,
      totalEvents,
      pendingMentorshipRequests,
      activeMentorshipConnections,
      scheduledSessions,
      totalRsvps,
      checkedInAttendees,
      unreadNotifications,
      recentRegistrations,
      recentDonations,
      alumniByYear,
      recentMentorshipRequests,
      recentNotifications,
      eventParticipation
    ] = await Promise.all([
      User.countDocuments({ role: 'alumni' }),
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 }
          }
        }
      ]),
      Event.countDocuments({
        date: { $gte: now },
        status: { $ne: 'cancelled' }
      }),
      Event.countDocuments(),
      MentorshipRequest.countDocuments({ status: 'pending' }),
      MentorshipRequest.countDocuments({ status: 'accepted' }),
      MentorshipSession.countDocuments({
        status: 'scheduled',
        scheduledFor: { $gte: now }
      }),
      EventRsvp.countDocuments({ status: 'going' }),
      EventRsvp.countDocuments({ status: 'going', checkedInAt: { $ne: null } }),
      Notification.countDocuments({ isRead: false }),
      User.find({
        role: 'alumni',
        createdAt: { $gte: thirtyDaysAgo }
      })
        .select('name email graduationYear department createdAt')
        .sort({ createdAt: -1 })
        .limit(10),
      Donation.find({ paymentStatus: 'completed' })
        .populate('alumniId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
      User.aggregate([
        { $match: { role: 'alumni' } },
        { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 10 }
      ]),
      MentorshipRequest.find()
        .populate('mentor', 'name email')
        .populate('mentee', 'name email')
        .sort({ createdAt: -1 })
        .limit(8),
      Notification.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(8),
      EventRsvp.aggregate([
        { $match: { status: 'going' } },
        {
          $group: {
            _id: '$event',
            attendeeCount: { $sum: 1 },
            checkedInCount: {
              $sum: {
                $cond: [{ $ifNull: ['$checkedInAt', false] }, 1, 0]
              }
            }
          }
        },
        { $sort: { attendeeCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'events',
            localField: '_id',
            foreignField: '_id',
            as: 'event'
          }
        },
        { $unwind: '$event' },
        {
          $project: {
            _id: 0,
            eventId: '$event._id',
            title: '$event.title',
            date: '$event.date',
            attendeeCount: 1,
            checkedInCount: 1
          }
        }
      ])
    ]);

    const totalDonations = donationStats[0]?.totalAmount || 0;
    const donationCount = donationStats[0]?.totalCount || 0;

    return sendSuccess(res, 200, 'Dashboard statistics retrieved successfully', {
      totalAlumni,
      totalDonations,
      donationCount,
      upcomingEvents,
      totalEvents,
      pendingMentorshipRequests,
      activeMentorshipConnections,
      scheduledSessions,
      totalRsvps,
      checkedInAttendees,
      unreadNotifications,
      recentRegistrations,
      recentDonations,
      alumniByYear,
      recentMentorshipRequests,
      recentNotifications,
      eventParticipation
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving dashboard statistics', error);
  }
};
