import { Response } from 'express';
import Event from '../models/Event';
import EventRsvp from '../models/EventRsvp';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { generateEventBannerImage } from '../services/eventImageService';
import { publishNotification } from '../services/notificationService';

const canManageEvent = (event: any, userId?: string, userRole?: string) => {
  if (!userId) {
    return false;
  }

  if (userRole === 'admin') {
    return true;
  }

  const createdById = String(event.createdBy?._id || event.createdBy);
  return createdById === userId;
};

const enrichEvent = async (event: any, currentUserId?: string) => {
  const activeRsvpCount = await EventRsvp.countDocuments({
    event: event._id,
    status: 'going'
  });

  const checkedInCount = await EventRsvp.countDocuments({
    event: event._id,
    status: 'going',
    checkedInAt: { $ne: null }
  });

  const isRegistered = Boolean(
    currentUserId && event.attendees.some((attendee: any) => String(attendee._id || attendee) === currentUserId)
  );

  return {
    ...event.toObject(),
    attendeeCount: activeRsvpCount,
    checkedInCount,
    availableSpots: Math.max(0, Number(event.maxAttendees || 0) - activeRsvpCount),
    isRegistered
  };
};

/**
 * Create new event
 * @route POST /api/events
 * @access Private (Admin)
 */
export const createEvent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { title, description, date, location, organizer, maxAttendees } = req.body;

    const attendeeLimit = Number(maxAttendees);
    const imageData = await generateEventBannerImage({
      title,
      description,
      location,
      date,
      maxAttendees: attendeeLimit
    });

    const event = await Event.create({
      title,
      description,
      date,
      location,
      organizer,
      maxAttendees: attendeeLimit,
      bannerImage: imageData.bannerImage,
      imageSource: imageData.imageSource,
      imagePrompt: imageData.imagePrompt,
      createdBy: req.user?._id
    });

    return sendSuccess(res, 201, 'Event created successfully', { event });
  } catch (error: any) {
    return sendError(res, 500, 'Error creating event', error);
  }
};

/**
 * Get all events
 * @route GET /api/events
 * @access Private
 */
export const getEvents = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { status, upcoming } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
      query.status = { $ne: 'cancelled' };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 });

    const enrichedEvents = await Promise.all(
      events.map((event) => enrichEvent(event, req.user?._id?.toString()))
    );

    return sendSuccess(res, 200, 'Events retrieved successfully', { events: enrichedEvents });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving events', error);
  }
};

/**
 * Get current user's RSVPs
 * @route GET /api/events/my-rsvps
 * @access Private
 */
export const getMyRsvps = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const rsvps = await EventRsvp.find({
      user: req.user?._id,
      status: 'going'
    })
      .populate({
        path: 'event',
        populate: [
          { path: 'createdBy', select: 'name email' },
          { path: 'attendees', select: 'name email' }
        ]
      })
      .populate('checkedInBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Your RSVPs retrieved successfully', { rsvps });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving your RSVPs', error);
  }
};

/**
 * Get event by ID
 * @route GET /api/events/:id
 * @access Private
 */
export const getEventById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name email graduationYear department');

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    const enrichedEvent = await enrichEvent(event, req.user?._id?.toString());
    return sendSuccess(res, 200, 'Event retrieved successfully', { event: enrichedEvent });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving event', error);
  }
};

/**
 * Get event attendance details
 * @route GET /api/events/:id/attendance
 * @access Private (Event creator or Admin)
 */
export const getEventAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    if (!canManageEvent(event, req.user?._id?.toString(), req.user?.role)) {
      return sendError(res, 403, 'Not authorized to view event attendance');
    }

    const attendance = await EventRsvp.find({
      event: event._id,
      status: 'going'
    })
      .populate('user', 'name email graduationYear department')
      .populate('checkedInBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Event attendance retrieved successfully', {
      event,
      attendance
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving event attendance', error);
  }
};

/**
 * Update event
 * @route PUT /api/events/:id
 * @access Private (Admin)
 */
export const updateEvent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    return sendSuccess(res, 200, 'Event updated successfully', { event });
  } catch (error: any) {
    return sendError(res, 500, 'Error updating event', error);
  }
};

/**
 * Delete event
 * @route DELETE /api/events/:id
 * @access Private (Admin)
 */
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    await EventRsvp.deleteMany({ event: req.params.id });

    return sendSuccess(res, 200, 'Event deleted successfully', {});
  } catch (error: any) {
    return sendError(res, 500, 'Error deleting event', error);
  }
};

/**
 * RSVP to event
 * @route POST /api/events/:id/rsvp
 * @access Private
 */
export const rsvpEvent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    const activeRsvpCount = await EventRsvp.countDocuments({
      event: event._id,
      status: 'going'
    });

    const existingRsvp = await EventRsvp.findOne({
      event: event._id,
      user: req.user?._id
    });

    if (existingRsvp?.status === 'going') {
      return sendError(res, 400, 'You have already registered for this event');
    }

    if (event.maxAttendees && activeRsvpCount >= event.maxAttendees) {
      return sendError(res, 400, 'Event is full');
    }

    if (existingRsvp) {
      existingRsvp.status = 'going';
      existingRsvp.checkedInAt = undefined;
      existingRsvp.checkedInBy = undefined;
      await existingRsvp.save();
    } else {
      await EventRsvp.create({
        event: event._id,
        user: req.user?._id,
        status: 'going'
      });
    }

    const alreadyTracked = event.attendees.some(
      (attendee) => attendee.toString() === req.user?._id.toString()
    );
    if (!alreadyTracked) {
      event.attendees.push(req.user?._id as any);
      await event.save();
    }

    const createdById = String((event.createdBy as any)?._id || event.createdBy);
    if (createdById !== String(req.user?._id)) {
      publishNotification(createdById, {
        type: 'event:rsvp',
        title: 'New event RSVP',
        body: `${req.user?.name || 'An alumni'} RSVP'd for ${event.title}.`,
        metadata: {
          eventId: event._id.toString(),
          userId: req.user?._id?.toString(),
          action: 'rsvp'
        }
      });
    }

    const refreshedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name email');

    return sendSuccess(res, 200, 'Successfully registered for event', {
      event: refreshedEvent ? await enrichEvent(refreshedEvent, req.user?._id?.toString()) : event
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error registering for event', error);
  }
};

/**
 * Cancel RSVP
 * @route DELETE /api/events/:id/rsvp
 * @access Private
 */
export const cancelRsvp = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name email');

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    const rsvp = await EventRsvp.findOne({
      event: event._id,
      user: req.user?._id,
      status: 'going'
    });

    if (!rsvp) {
      return sendError(res, 400, 'You do not currently have an RSVP for this event');
    }

    rsvp.status = 'cancelled';
    rsvp.checkedInAt = undefined;
    rsvp.checkedInBy = undefined;
    await rsvp.save();

    event.attendees = event.attendees.filter(
      (attendee: any) => String(attendee._id || attendee) !== req.user?._id.toString()
    ) as any;
    await event.save();

    return sendSuccess(res, 200, 'RSVP cancelled successfully', {
      event: await enrichEvent(event, req.user?._id?.toString())
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error cancelling RSVP', error);
  }
};

/**
 * Check in event attendee
 * @route PATCH /api/events/:id/attendance/:userId/check-in
 * @access Private (Event creator or Admin)
 */
export const checkInEventAttendee = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    if (!canManageEvent(event, req.user?._id?.toString(), req.user?.role)) {
      return sendError(res, 403, 'Not authorized to check in attendees for this event');
    }

    const rsvp = await EventRsvp.findOne({
      event: event._id,
      user: req.params.userId,
      status: 'going'
    })
      .populate('user', 'name email graduationYear department')
      .populate('checkedInBy', 'name email');

    if (!rsvp) {
      return sendError(res, 404, 'RSVP record not found for this attendee');
    }

    if (rsvp.checkedInAt) {
      return sendError(res, 400, 'Attendee has already been checked in');
    }

    rsvp.checkedInAt = new Date();
    rsvp.checkedInBy = req.user?._id as any;
    await rsvp.save();
    await rsvp.populate('checkedInBy', 'name email');

    publishNotification(String(req.params.userId), {
      type: 'event:rsvp',
      title: 'Event check-in confirmed',
      body: `You have been checked in for ${event.title}.`,
      metadata: {
        eventId: event._id.toString(),
        action: 'check-in'
      }
    });

    return sendSuccess(res, 200, 'Attendee checked in successfully', { attendance: rsvp });
  } catch (error: any) {
    return sendError(res, 500, 'Error checking in attendee', error);
  }
};

/**
 * Regenerate event banner image
 * @route POST /api/events/:id/regenerate-banner
 * @access Private (Event creator or Admin)
 */
export const regenerateEventBanner = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return sendError(res, 404, 'Event not found');
    }

    const isCreator = event.createdBy.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isCreator && !isAdmin) {
      return sendError(res, 403, 'Not authorized to regenerate this event banner');
    }

    const imageData = await generateEventBannerImage({
      title: event.title,
      description: event.description,
      location: event.location,
      date: event.date,
      maxAttendees: event.maxAttendees
    });

    event.bannerImage = imageData.bannerImage;
    event.imageSource = imageData.imageSource;
    event.imagePrompt = imageData.imagePrompt;
    await event.save();

    const provider = (process.env.EVENT_IMAGE_PROVIDER || 'openai').toLowerCase();
    const message = imageData.imageSource === 'local'
      ? 'Event banner regenerated with local AI'
      : imageData.imageSource === 'ai'
        ? 'Event banner regenerated with OpenAI'
        : provider === 'fallback'
          ? 'Event banner regenerated with fallback template'
          : 'Local image generator unavailable, fallback banner was used';

    return sendSuccess(res, 200, message, { event });
  } catch (error: any) {
    return sendError(res, 500, 'Error regenerating event banner', error);
  }
};
