import { Response } from 'express';

/**
 * Standard API response interface
 */
export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Send success response
 */
export const sendSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data?: any
): Response => {
  const response: ApiResponse = {
    success: true,
    message,
    data
  };
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  statusCode: number,
  message: string,
  error?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: error?.message || error
  };
  return res.status(statusCode).json(response);
};
