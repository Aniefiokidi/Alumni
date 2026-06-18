import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { sendError } from '../utils/response';

/**
 * Extended Request interface with user data
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    // Check if token exists
    if (!token) {
      return sendError(res, 401, 'Not authorized, no token provided');
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    // Get user from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, 401, 'Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Not authorized, token failed');
  }
};

/**
 * Authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return sendError(res, 401, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }

    next();
  };
};
