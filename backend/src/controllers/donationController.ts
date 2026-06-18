import { Response } from 'express';
import Donation from '../models/Donation';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

/**
 * Create donation
 * @route POST /api/donations
 * @access Private
 */
export const createDonation = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { amount, paymentMethod, purpose, message, isAnonymous } = req.body;

    const donation = await Donation.create({
      alumniId: req.user?._id,
      amount,
      paymentMethod,
      purpose,
      message,
      isAnonymous: isAnonymous || false,
      paymentStatus: 'completed', // In real app, this would be set after payment gateway confirmation
      transactionId: `TXN${Date.now()}` // Generate unique transaction ID
    });

    return sendSuccess(res, 201, 'Donation created successfully', { donation });
  } catch (error: any) {
    return sendError(res, 500, 'Error creating donation', error);
  }
};

/**
 * Get all donations
 * @route GET /api/donations
 * @access Private (Admin)
 */
export const getDonations = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const donations = await Donation.find()
      .populate('alumniId', 'name email graduationYear')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Donations retrieved successfully', { donations });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving donations', error);
  }
};

/**
 * Get user's donations
 * @route GET /api/donations/my-donations
 * @access Private
 */
export const getMyDonations = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const donations = await Donation.find({ alumniId: req.user?._id })
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Your donations retrieved successfully', { donations });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving donations', error);
  }
};

/**
 * Get donation statistics
 * @route GET /api/donations/stats
 * @access Private (Admin)
 */
export const getDonationStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    // Total donations
    const totalDonationsResult = await Donation.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalAmount = totalDonationsResult[0]?.total || 0;

    // Count of donations
    const totalCount = await Donation.countDocuments({ paymentStatus: 'completed' });

    // Donations by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const byMonth = await Donation.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top donors
    const topDonors = await Donation.aggregate([
      { $match: { paymentStatus: 'completed', isAnonymous: false } },
      {
        $group: {
          _id: '$alumniId',
          totalDonated: { $sum: '$amount' },
          donationCount: { $sum: 1 }
        }
      },
      { $sort: { totalDonated: -1 } },
      { $limit: 10 }
    ]);

    // Populate donor info
    await Donation.populate(topDonors, {
      path: '_id',
      select: 'name email graduationYear'
    });

    return sendSuccess(res, 200, 'Donation statistics retrieved successfully', {
      totalAmount,
      totalCount,
      byMonth,
      topDonors
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving donation statistics', error);
  }
};
