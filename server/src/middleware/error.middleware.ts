import { NextFunction, Request, Response } from 'express';
import { AppError, BREError } from '../errors';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof BREError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      rejectionReasons: err.rejectionReasons,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
