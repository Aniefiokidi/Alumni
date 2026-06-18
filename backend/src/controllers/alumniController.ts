import { Response } from 'express';
import User from '../models/User';
import Event from '../models/Event';
import Message from '../models/Message';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { searchCompanySuggestions } from '../services/companyEnrichmentService';

const buildProfileResponse = async (alumni: any) => {
  const alumniId = alumni._id;

  const [attendedEvents, sentMessages, receivedMessages] = await Promise.all([
    Event.countDocuments({ attendees: alumniId }),
    Message.countDocuments({ sender: alumniId }),
    Message.countDocuments({ receiver: alumniId })
  ]);

  const timeline = [
    {
      type: 'joined',
      label: 'Joined Alumni Platform',
      date: alumni.createdAt
    },
    alumni.graduationYear
      ? {
          type: 'graduation',
          label: `Graduated (${alumni.graduationYear})`,
          date: new Date(`${alumni.graduationYear}-07-01T00:00:00.000Z`)
        }
      : null,
    alumni.updatedAt
      ? {
          type: 'profile-update',
          label: 'Updated profile',
          date: alumni.updatedAt
        }
      : null
  ].filter(Boolean);

  return {
    alumni,
    activity: {
      stats: {
        attendedEvents,
        sentMessages,
        receivedMessages
      },
      timeline
    }
  };
};

/**
 * Get all alumni (with filtering and search)
 * @route GET /api/alumni
 * @access Private
 */
export const getAlumni = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const {
      search,
      graduationYear,
      department,
      location,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query: any = { role: 'alumni' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }

    if (graduationYear) {
      query.graduationYear = Number(graduationYear);
    }

    if (department) {
      const escapedDepartment = String(department).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.department = { $regex: `^${escapedDepartment}$`, $options: 'i' };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const alumni = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    return sendSuccess(res, 200, 'Alumni retrieved successfully', {
      alumni,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving alumni', error);
  }
};

/**
 * Get alumni by ID
 * @route GET /api/alumni/:id
 * @access Private
 */
export const getAlumniById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const alumni = await User.findById(req.params.id).select('-password');

    if (!alumni) {
      return sendError(res, 404, 'Alumni not found');
    }

    const profile = await buildProfileResponse(alumni);

    return sendSuccess(res, 200, 'Alumni retrieved successfully', profile);
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving alumni', error);
  }
};

/**
 * Get alumni by slug
 * @route GET /api/alumni/profile/:slug
 * @access Private
 */
export const getAlumniBySlug = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const alumni = await User.findOne({ slug: req.params.slug }).select('-password');

    if (!alumni) {
      return sendError(res, 404, 'Alumni not found');
    }

    const profile = await buildProfileResponse(alumni);

    return sendSuccess(res, 200, 'Alumni retrieved successfully', profile);
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving alumni profile', error);
  }
};

/**
 * Get alumni statistics
 * @route GET /api/alumni/stats
 * @access Private (Admin)
 */
export const getAlumniStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const totalAlumni = await User.countDocuments({ role: 'alumni' });

    // Group by graduation year
    const byYear = await User.aggregate([
      { $match: { role: 'alumni' } },
      { $group: { _id: '$graduationYear', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Group by department
    const byDepartment = await User.aggregate([
      { $match: { role: 'alumni' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRegistrations = await User.countDocuments({
      role: 'alumni',
      createdAt: { $gte: thirtyDaysAgo }
    });

    return sendSuccess(res, 200, 'Alumni statistics retrieved successfully', {
      totalAlumni,
      byYear,
      byDepartment,
      recentRegistrations
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving alumni statistics', error);
  }
};

/**
 * Search company suggestions for profile autocomplete
 * @route GET /api/alumni/companies/search
 * @access Private
 */
export const searchCompanies = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const query = String(req.query.query || '').trim();

    if (query.length < 2) {
      return sendSuccess(res, 200, 'Company suggestions retrieved', { suggestions: [] });
    }

    const external = await searchCompanySuggestions(query);
    const dbCompanies = await User.find({
      company: { $regex: query, $options: 'i' }
    })
      .select('company companyDomain companyWebsite companyLogoUrl')
      .limit(8)
      .lean();

    const dbSuggestions = dbCompanies
      .map((record: any) => ({
        name: String(record.company || '').trim(),
        domain: record.companyDomain || undefined,
        website: record.companyWebsite || undefined,
        logoUrl: record.companyLogoUrl || undefined
      }))
      .filter((item) => item.name);

    const merged = [...external, ...dbSuggestions];
    const seen = new Set<string>();
    const suggestions = merged.filter((item) => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).slice(0, 10);

    return sendSuccess(res, 200, 'Company suggestions retrieved', { suggestions });
  } catch (error: any) {
    return sendError(res, 500, 'Error searching company suggestions', error);
  }
};
