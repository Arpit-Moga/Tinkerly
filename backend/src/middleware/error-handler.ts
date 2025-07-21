import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(isProduction ? {} : { stack: err.stack }),
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  res.status(statusCode).json(errorResponse);
};