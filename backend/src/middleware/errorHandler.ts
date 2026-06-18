import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Global error handling middleware
 * Catches all errors and sends a standardized response
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, statusCode, message, err);
};

/**
 * Handle 404 - Route not found
 */
export const notFound = (req: Request, res: Response, next: NextFunction): Response => {
  return sendError(res, 404, `Route ${req.originalUrl} not found`);
};
