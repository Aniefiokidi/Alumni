import mongoose from 'mongoose';
import { Response } from 'express';
import MentorshipRequest from '../models/MentorshipRequest';
import MentorshipSession from '../models/MentorshipSession';
import User from '../models/User';
import { sendError, sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { publishNotification } from '../services/notificationService';

const mentorSelectFields = [
  'name',
  'email',
  'slug',
  'graduationYear',
  'department',
  'employmentStatus',
  'jobTitle',
  'company',
  'location',
  'bio',
  'linkedIn',
  'profilePicture',
  'openToMentorship',
  'mentorshipTopics',
  'skills',
  'mentorshipAvailability',
  'mentorshipCapacity'
].join(' ');

const requestPopulateConfig = [
  { path: 'mentor', select: mentorSelectFields },
  { path: 'mentee', select: mentorSelectFields }
];

const sessionPopulateConfig = [
  { path: 'mentor', select: mentorSelectFields },
  { path: 'mentee', select: mentorSelectFields },
  { path: 'scheduledBy', select: 'name email' },
  { path: 'mentorshipRequest', populate: requestPopulateConfig }
];

const getAcceptedMentorCounts = async (mentorIds: string[]) => {
  if (mentorIds.length === 0) {
    return new Map<string, number>();
  }

  const counts = await MentorshipRequest.aggregate([
    {
      $match: {
        status: 'accepted',
        mentor: { $in: mentorIds.map((id) => new mongoose.Types.ObjectId(id)) }
      }
    },
    {
      $group: {
        _id: '$mentor',
        count: { $sum: 1 }
      }
    }
  ]);

  return new Map<string, number>(counts.map((item) => [String(item._id), Number(item.count || 0)]));
};

const calculateCompatibilityScore = (currentUser: any, mentor: any): number => {
  let score = 40;

  if (currentUser?.department && mentor?.department && currentUser.department === mentor.department) {
    score += 25;
  }

  if (
    typeof currentUser?.graduationYear === 'number' &&
    typeof mentor?.graduationYear === 'number' &&
    Math.abs(currentUser.graduationYear - mentor.graduationYear) <= 3
  ) {
    score += 15;
  }

  if (mentor?.employmentStatus && ['employed', 'self-employed'].includes(mentor.employmentStatus)) {
    score += 10;
  }

  if (mentor?.company) {
    score += 5;
  }

  if (mentor?.bio) {
    score += 5;
  }

  const menteeSkills = new Set((currentUser?.skills || []).map((skill: string) => String(skill).toLowerCase().trim()));
  const mentorTopics = (mentor?.mentorshipTopics || []).map((topic: string) => String(topic).toLowerCase().trim());
  const mentorSkills = (mentor?.skills || []).map((skill: string) => String(skill).toLowerCase().trim());

  const topicOverlap = mentorTopics.filter((topic: string) => menteeSkills.has(topic)).length;
  if (topicOverlap > 0) {
    score += Math.min(15, topicOverlap * 5);
  }

  const skillOverlap = mentorSkills.filter((skill: string) => menteeSkills.has(skill)).length;
  if (skillOverlap > 0) {
    score += Math.min(10, skillOverlap * 3);
  }

  if (mentor?.mentorshipAvailability && mentor.mentorshipAvailability !== 'not-available') {
    score += 5;
  }

  return Math.min(100, score);
};

/**
 * Get mentor matches for current user
 * @route GET /api/mentorship/matches
 * @access Private
 */
export const getMentorMatches = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { search, department, graduationYear, topic } = req.query;

    const query: any = {
      role: 'alumni',
      openToMentorship: true,
      _id: { $ne: req.user?._id }
    };

    if (department) {
      query.department = new RegExp(String(department), 'i');
    }

    if (graduationYear && !Number.isNaN(Number(graduationYear))) {
      query.graduationYear = Number(graduationYear);
    }

    if (search) {
      const pattern = new RegExp(String(search), 'i');
      query.$or = [
        { name: pattern },
        { department: pattern },
        { jobTitle: pattern },
        { company: pattern },
        { location: pattern },
        { mentorshipTopics: pattern },
        { skills: pattern }
      ];
    }

    if (topic) {
      query.mentorshipTopics = new RegExp(String(topic), 'i');
    }

    const [mentors, existingRequests] = await Promise.all([
      User.find(query).select(mentorSelectFields).sort({ updatedAt: -1 }),
      MentorshipRequest.find({
        mentee: req.user?._id,
        status: 'pending'
      }).select('mentor')
    ]);

    const acceptedCounts = await getAcceptedMentorCounts(mentors.map((mentor: any) => String(mentor._id)));
    const pendingMentorIds = new Set(existingRequests.map((request: any) => String(request.mentor)));

    const matches = mentors
      .map((mentor: any) => {
        const plainMentor = mentor.toObject();
        const acceptedCount = acceptedCounts.get(String(plainMentor._id)) || 0;
        const mentorshipCapacity = Math.max(1, Number(plainMentor.mentorshipCapacity || 1));
        const availableSlots = Math.max(0, mentorshipCapacity - acceptedCount);
        const isAtCapacity = availableSlots === 0;

        return {
          ...plainMentor,
          compatibilityScore: calculateCompatibilityScore(req.user, plainMentor),
          alreadyRequested: pendingMentorIds.has(String(plainMentor._id)),
          acceptedCount,
          availableSlots,
          isAtCapacity
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return sendSuccess(res, 200, 'Mentor matches retrieved successfully', { matches });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving mentor matches', error);
  }
};

/**
 * Create mentorship request
 * @route POST /api/mentorship/requests
 * @access Private
 */
export const createMentorshipRequest = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { mentorId, goals, message } = req.body;

    if (String(mentorId) === String(req.user?._id)) {
      return sendError(res, 400, 'You cannot send a mentorship request to yourself');
    }

    const mentor = await User.findOne({ _id: mentorId, role: 'alumni' });

    if (!mentor) {
      return sendError(res, 404, 'Mentor not found');
    }

    if (!mentor.openToMentorship) {
      return sendError(res, 400, 'This mentor is not currently accepting mentorship requests');
    }

    const acceptedCount = await MentorshipRequest.countDocuments({
      mentor: mentorId,
      status: 'accepted'
    });

    if (acceptedCount >= Math.max(1, Number(mentor.mentorshipCapacity || 1))) {
      return sendError(res, 400, 'This mentor is currently at full mentorship capacity');
    }

    const duplicatePending = await MentorshipRequest.findOne({
      mentor: mentorId,
      mentee: req.user?._id,
      status: 'pending'
    });

    if (duplicatePending) {
      return sendError(res, 400, 'You already have a pending request to this mentor');
    }

    const mentorshipRequest = await MentorshipRequest.create({
      mentor: mentorId,
      mentee: req.user?._id,
      goals,
      message
    });

    await mentorshipRequest.populate(requestPopulateConfig);

    publishNotification(String(mentorId), {
      type: 'mentorship:request',
      title: 'New mentorship request',
      body: `${req.user?.name || 'An alumni'} wants you as a mentor.`,
      metadata: {
        requestId: mentorshipRequest._id.toString(),
        menteeId: req.user?._id?.toString()
      }
    });

    return sendSuccess(res, 201, 'Mentorship request sent successfully', { mentorshipRequest });
  } catch (error: any) {
    return sendError(res, 500, 'Error creating mentorship request', error);
  }
};

/**
 * Get current user's mentorship requests
 * @route GET /api/mentorship/requests/my
 * @access Private
 */
export const getMyMentorshipRequests = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user?._id;

    const [sentRequests, receivedRequests, activeConnections] = await Promise.all([
      MentorshipRequest.find({ mentee: userId })
        .populate(requestPopulateConfig)
        .sort({ createdAt: -1 }),
      MentorshipRequest.find({ mentor: userId })
        .populate(requestPopulateConfig)
        .sort({ createdAt: -1 }),
      MentorshipRequest.find({
        status: 'accepted',
        $or: [{ mentor: userId }, { mentee: userId }]
      })
        .populate(requestPopulateConfig)
        .sort({ updatedAt: -1 })
    ]);

    return sendSuccess(res, 200, 'Mentorship requests retrieved successfully', {
      sentRequests,
      receivedRequests,
      activeConnections
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving mentorship requests', error);
  }
};

/**
 * Get current user's mentorship sessions
 * @route GET /api/mentorship/sessions/my
 * @access Private
 */
export const getMyMentorshipSessions = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const sessions = await MentorshipSession.find({
      $or: [{ mentor: req.user?._id }, { mentee: req.user?._id }]
    })
      .populate(sessionPopulateConfig)
      .sort({ scheduledFor: 1 });

    return sendSuccess(res, 200, 'Mentorship sessions retrieved successfully', { sessions });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving mentorship sessions', error);
  }
};

/**
 * Create mentorship session
 * @route POST /api/mentorship/sessions
 * @access Private
 */
export const createMentorshipSession = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { requestId, scheduledFor, durationMinutes, agenda, meetingLink } = req.body;

    const mentorshipRequest = await MentorshipRequest.findById(requestId).populate(requestPopulateConfig);

    if (!mentorshipRequest) {
      return sendError(res, 404, 'Mentorship request not found');
    }

    if (mentorshipRequest.status !== 'accepted') {
      return sendError(res, 400, 'You can only schedule sessions for accepted mentorship requests');
    }

    const userId = String(req.user?._id);
    const mentorId = String((mentorshipRequest.mentor as any)._id);
    const menteeId = String((mentorshipRequest.mentee as any)._id);

    if (![mentorId, menteeId].includes(userId)) {
      return sendError(res, 403, 'Not authorized to schedule this mentorship session');
    }

    const session = await MentorshipSession.create({
      mentorshipRequest: mentorshipRequest._id,
      mentor: mentorId,
      mentee: menteeId,
      scheduledFor,
      durationMinutes,
      agenda,
      meetingLink,
      scheduledBy: req.user?._id
    });

    await session.populate(sessionPopulateConfig);

    const recipientId = userId === mentorId ? menteeId : mentorId;
    publishNotification(recipientId, {
      type: 'mentorship:session',
      title: 'New mentorship session scheduled',
      body: `${req.user?.name || 'Your mentorship partner'} scheduled a session for ${new Date(scheduledFor).toLocaleString()}.`,
      metadata: {
        sessionId: session._id.toString(),
        requestId: mentorshipRequest._id.toString()
      }
    });

    return sendSuccess(res, 201, 'Mentorship session scheduled successfully', { session });
  } catch (error: any) {
    return sendError(res, 500, 'Error scheduling mentorship session', error);
  }
};

/**
 * Update mentorship request status
 * @route PATCH /api/mentorship/requests/:id/status
 * @access Private
 */
export const updateMentorshipRequestStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { status } = req.body;
    const request = await MentorshipRequest.findById(req.params.id).populate(requestPopulateConfig);

    if (!request) {
      return sendError(res, 404, 'Mentorship request not found');
    }

    const userId = String(req.user?._id);
    const isMentor = String((request.mentor as any)._id) === userId;
    const isMentee = String((request.mentee as any)._id) === userId;

    if (!isMentor && !isMentee) {
      return sendError(res, 403, 'Not authorized to update this mentorship request');
    }

    if (request.status !== 'pending') {
      return sendError(res, 400, `Request has already been ${request.status}`);
    }

    if (status === 'cancelled' && !isMentee) {
      return sendError(res, 403, 'Only the mentee can cancel this request');
    }

    if (['accepted', 'rejected'].includes(status) && !isMentor) {
      return sendError(res, 403, 'Only the mentor can accept or reject this request');
    }

    if (status === 'accepted') {
      const acceptedCount = await MentorshipRequest.countDocuments({
        mentor: (request.mentor as any)._id,
        status: 'accepted'
      });

      const mentorshipCapacity = Math.max(1, Number((request.mentor as any).mentorshipCapacity || 1));
      if (acceptedCount >= mentorshipCapacity) {
        return sendError(res, 400, 'Mentorship capacity is full for this mentor');
      }
    }

    request.status = status;
    request.respondedAt = new Date();
    await request.save();
    await request.populate(requestPopulateConfig);

    publishNotification(String((request.mentee as any)._id), {
      type: 'mentorship:status',
      title: 'Mentorship request updated',
      body: `${(request.mentor as any).name || 'Your mentor'} ${status} your mentorship request.`,
      metadata: {
        requestId: request._id.toString(),
        status,
        mentorId: (request.mentor as any)._id?.toString()
      }
    });

    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    return sendSuccess(res, 200, `Mentorship request ${statusLabel.toLowerCase()} successfully`, {
      mentorshipRequest: request
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error updating mentorship request', error);
  }
};

/**
 * Update mentorship session status
 * @route PATCH /api/mentorship/sessions/:id/status
 * @access Private
 */
export const updateMentorshipSessionStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { status, notes } = req.body;
    const session = await MentorshipSession.findById(req.params.id).populate(sessionPopulateConfig);

    if (!session) {
      return sendError(res, 404, 'Mentorship session not found');
    }

    const userId = String(req.user?._id);
    const mentorId = String((session.mentor as any)._id);
    const menteeId = String((session.mentee as any)._id);

    if (![mentorId, menteeId].includes(userId)) {
      return sendError(res, 403, 'Not authorized to update this session');
    }

    if (session.status !== 'scheduled') {
      return sendError(res, 400, `This session has already been ${session.status}`);
    }

    session.status = status;
    if (typeof notes === 'string' && notes.trim()) {
      session.notes = notes.trim();
    }

    if (status === 'completed') {
      session.completedAt = new Date();
    }

    if (status === 'cancelled') {
      session.cancelledAt = new Date();
    }

    await session.save();
    await session.populate(sessionPopulateConfig);

    const recipientId = userId === mentorId ? menteeId : mentorId;
    publishNotification(recipientId, {
      type: 'mentorship:session',
      title: 'Mentorship session updated',
      body: `${req.user?.name || 'Your mentorship partner'} marked your session as ${status}.`,
      metadata: {
        sessionId: session._id.toString(),
        requestId: ((session.mentorshipRequest as any)?._id || session.mentorshipRequest).toString()
      }
    });

    return sendSuccess(res, 200, 'Mentorship session updated successfully', { session });
  } catch (error: any) {
    return sendError(res, 500, 'Error updating mentorship session', error);
  }
};
