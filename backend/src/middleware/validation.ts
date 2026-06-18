import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Validation middleware to check for errors
 */
export const validate = (req: Request, res: Response, next: NextFunction): void | Response => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  next();
};

/**
 * User registration validation rules
 */
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('graduationYear')
    .notEmpty().withMessage('Graduation year is required')
    .isNumeric().withMessage('Graduation year must be a number'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  validate
];

/**
 * User login validation rules
 */
export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

/**
 * Event creation validation rules
 */
export const eventValidation = [
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('description').trim().notEmpty().withMessage('Event description is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').trim().notEmpty().withMessage('Event location is required'),
  body('organizer').trim().notEmpty().withMessage('Organizer name is required'),
  body('maxAttendees')
    .notEmpty().withMessage('Attendee capacity is required')
    .isInt({ min: 1 }).withMessage('Attendee capacity must be at least 1'),
  validate
];

/**
 * Donation validation rules
 */
export const donationValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number')
    .custom((value) => value > 0).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'other'])
    .withMessage('Invalid payment method'),
  validate
];

/**
 * Announcement validation rules
 */
export const announcementValidation = [
  body('title').trim().notEmpty().withMessage('Announcement title is required'),
  body('content').trim().notEmpty().withMessage('Announcement content is required'),
  validate
];

/**
 * Message validation rules
 */
export const messageValidation = [
  body('receiver').notEmpty().withMessage('Receiver is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message content is required'),
  validate
];

/**
 * Message AI reply draft validation rules
 */
export const messageReplyDraftValidation = [
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'concise'])
    .withMessage('Tone must be professional, friendly, or concise'),
  body('maxWords')
    .optional()
    .isInt({ min: 30, max: 300 })
    .withMessage('maxWords must be between 30 and 300'),
  validate
];

/**
 * Mentorship request validation rules
 */
export const mentorshipRequestValidation = [
  body('mentorId').notEmpty().withMessage('Mentor is required'),
  body('goals')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Goals must be between 10 and 300 characters'),
  body('message')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  validate
];

/**
 * Mentorship status update validation rules
 */
export const mentorshipStatusValidation = [
  body('status')
    .isIn(['accepted', 'rejected', 'cancelled'])
    .withMessage('Status must be accepted, rejected, or cancelled'),
  validate
];

/**
 * Mentorship session validation rules
 */
export const mentorshipSessionValidation = [
  body('requestId').notEmpty().withMessage('Mentorship request is required'),
  body('scheduledFor').isISO8601().withMessage('A valid session date is required'),
  body('durationMinutes')
    .isInt({ min: 15, max: 240 })
    .withMessage('Session duration must be between 15 and 240 minutes'),
  body('agenda')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Agenda must be between 10 and 500 characters'),
  body('meetingLink')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Meeting link cannot exceed 300 characters'),
  validate
];

/**
 * Mentorship session status update validation rules
 */
export const mentorshipSessionStatusValidation = [
  body('status')
    .isIn(['completed', 'cancelled'])
    .withMessage('Status must be completed or cancelled'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  validate
];

/**
 * Profile update validation rules
 */
export const profileUpdateValidation = [
  body('employmentStatus')
    .optional()
    .isIn(['employed', 'unemployed', 'self-employed', 'student', 'seeking-opportunities'])
    .withMessage('Invalid employment status'),
  body('jobTitle')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Job title cannot exceed 120 characters'),
  body('company')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Company cannot exceed 120 characters'),
  body().custom((value) => {
    if (value?.employmentStatus === 'employed') {
      if (!String(value?.jobTitle || '').trim()) {
        throw new Error('Job title is required when employment status is employed');
      }
      if (!String(value?.company || '').trim()) {
        throw new Error('Company is required when employment status is employed');
      }
    }
    return true;
  }),
  body('openToMentorship')
    .optional()
    .isBoolean()
    .withMessage('openToMentorship must be true or false'),
  body('mentorshipTopics')
    .optional()
    .isArray({ max: 15 })
    .withMessage('mentorshipTopics must be an array with up to 15 entries'),
  body('mentorshipTopics.*')
    .optional()
    .isString()
    .isLength({ min: 2, max: 40 })
    .withMessage('Each mentorship topic must be between 2 and 40 characters'),
  body('skills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('skills must be an array with up to 20 entries'),
  body('skills.*')
    .optional()
    .isString()
    .isLength({ min: 2, max: 40 })
    .withMessage('Each skill must be between 2 and 40 characters'),
  body('mentorshipAvailability')
    .optional()
    .isIn(['not-available', 'weekdays-evenings', 'weekends', 'flexible'])
    .withMessage('Invalid mentorship availability option'),
  body('mentorshipCapacity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('mentorshipCapacity must be between 1 and 10'),
  validate
];
