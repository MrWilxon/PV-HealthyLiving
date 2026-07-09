import { logger } from './logger';

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  API_KEY?: string;
  ADMIN_KEY?: string;
}

function validateEnv(): EnvConfig {
  const errors: string[] = [];

  const PORT = parseInt(process.env.PORT || '5000', 10);
  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    errors.push('PORT must be a valid port number (1-65535)');
  }

  const NODE_ENV = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(NODE_ENV)) {
    errors.push('NODE_ENV must be development, production, or test');
  }

  const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

  const API_KEY = process.env.API_KEY;
  const ADMIN_KEY = process.env.ADMIN_KEY;

  if (NODE_ENV === 'production') {
    if (!API_KEY) {
      logger.warn('API_KEY not set in production - auth is disabled');
    }
    if (!ADMIN_KEY) {
      logger.warn('ADMIN_KEY not set in production - admin endpoints are unprotected');
    }
  }

  if (errors.length > 0) {
    logger.error('Environment validation failed', { errors });
    process.exit(1);
  }

  return {
    PORT,
    NODE_ENV,
    CORS_ORIGIN,
    API_KEY,
    ADMIN_KEY,
  };
}

export const config = validateEnv();
