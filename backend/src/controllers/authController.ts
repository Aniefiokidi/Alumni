import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { enrichCompanyDetails } from '../services/companyEnrichmentService';

/**
 * Generate JWT Token
 */
const generateToken = (id: string): string => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
  );
};

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, graduationYear, department } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!normalizedEmail) {
      return sendError(res, 400, 'Email is required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 400, 'User already exists with this email');
    }

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'alumni',
      graduationYear,
      department
    });

    // Generate token
    const token = generateToken(user._id.toString());

    return sendSuccess(res, 201, 'User registered successfully', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error registering user', error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!normalizedEmail) {
      return sendError(res, 400, 'Email is required');
    }

    // Find user by email (include password field)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Generate token
    const token = generateToken(user._id.toString());

    return sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    return sendError(res, 500, 'Error logging in', error);
  }
};

/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.user?._id);
    
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'User retrieved successfully', { user });
  } catch (error: any) {
    return sendError(res, 500, 'Error retrieving user', error);
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const allowedUpdates = [
      'name',
      'graduationYear',
      'department',
      'employmentStatus',
      'jobTitle',
      'company',
      'location',
      'phone',
      'linkedIn',
      'bio',
      'profilePicture',
      'openToMentorship',
      'mentorshipTopics',
      'skills',
      'mentorshipAvailability',
      'mentorshipCapacity'
    ];

    const updates: any = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (updates.employmentStatus && updates.employmentStatus !== 'employed') {
      updates.jobTitle = undefined;
      updates.company = undefined;
      updates.companyWebsite = undefined;
      updates.companyDomain = undefined;
      updates.companyLogoUrl = undefined;
    }

    if (updates.company) {
      const enrichment = await enrichCompanyDetails(updates.company);
      if (enrichment) {
        updates.companyWebsite = enrichment.companyWebsite;
        updates.companyDomain = enrichment.companyDomain;
        updates.companyLogoUrl = enrichment.companyLogoUrl;
      } else {
        updates.companyWebsite = undefined;
        updates.companyDomain = undefined;
        updates.companyLogoUrl = undefined;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    return sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (error: any) {
    return sendError(res, 500, 'Error updating profile', error);
  }
};
