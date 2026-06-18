import { Response } from 'express';
import Announcement from '../models/Announcement';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

/**
 * Create announcement
 * @route POST /api/announcements
 * @access Private (Admin)
 */
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { title, content, category, isPinned } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      category,
      isPinned: isPinned || false,
      author: req.user?._id
    });

    return sendSuccess(res, 201, 'Announcement created successfully', { announcement });
  } catch (error: any) {
    return sendError(res, 500, 'Error creating announcement', error);
  }
};

/**
 * Get all announcements
 * @route GET /api/announcements
 * @access Private
 */
export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { category } = req.query;

    const query: any = {};
    if (category) {
      query.category = category;
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name email')
      .sort({ isPinned: -1, createdAt: -1 });

    return sendSuccess(res, 200, 'Announcements retrieved successfully', { announcements });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving announcements', error);
  }
};

/**
 * Get announcement by ID
 * @route GET /api/announcements/:id
 * @access Private
 */
export const getAnnouncementById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('author', 'name email');

    if (!announcement) {
      return sendError(res, 404, 'Announcement not found');
    }

    // Increment views
    announcement.views += 1;
    await announcement.save();

    return sendSuccess(res, 200, 'Announcement retrieved successfully', { announcement });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving announcement', error);
  }
};

/**
 * Update announcement
 * @route PUT /api/announcements/:id
 * @access Private (Admin)
 */
export const updateAnnouncement = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return sendError(res, 404, 'Announcement not found');
    }

    return sendSuccess(res, 200, 'Announcement updated successfully', { announcement });
  } catch (error: any) {
    return sendError(res, 500, 'Error updating announcement', error);
  }
};

/**
 * Delete announcement
 * @route DELETE /api/announcements/:id
 * @access Private (Admin)
 */
export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return sendError(res, 404, 'Announcement not found');
    }

    return sendSuccess(res, 200, 'Announcement deleted successfully', {});
  } catch (error: any) {
    return sendError(res, 500, 'Error deleting announcement', error);
  }
};
