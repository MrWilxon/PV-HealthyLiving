import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof AppError ? err.status : 500;
  const message = err instanceof AppError ? err.message : 'Internal Server Error';

  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    status,
    method: req.method,
    url: req.originalUrl,
  });

  const response: any = { error: { message, status } };
  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
