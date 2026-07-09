import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return next();
  }

  const providedKey = req.headers['x-api-key'] || req.query.api_key;

  if (!providedKey || providedKey !== apiKey) {
    return next(new AppError('Unauthorized: Invalid or missing API key', 401));
  }

  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return next(new AppError('Admin access not configured', 500));
  }

  const providedKey = req.headers['x-admin-key'] || req.body?.admin_key;

  if (!providedKey || providedKey !== adminKey) {
    return next(new AppError('Forbidden: Admin access required', 403));
  }

  next();
}
