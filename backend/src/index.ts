import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { apiLimiter, strictLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';
import { config } from './utils/config';
import { db } from './config/firebase';
import { asyncHandler } from './middleware/errorHandler';
import productsRouter from './routes/products';
import portfoliosRouter from './routes/portfolios';
import portfolioItemsRouter from './routes/portfolioItems';
import settingsRouter from './routes/settings';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);
app.use('/api', apiLimiter);
app.use('/api', authMiddleware);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/portfolios', portfoliosRouter);
app.use('/api/portfolio', portfolioItemsRouter);
app.use('/api/settings', settingsRouter);

app.use('/api/settings/reset', strictLimiter);
app.use('/api/settings/restore', strictLimiter);

app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
  const [productsSnapshot, portfoliosSnapshot, portfolioItemsSnapshot] = await Promise.all([
    db.collection('products').get(),
    db.collection('portfolios').orderBy('updatedAt', 'desc').limit(5).get(),
    db.collection('portfolioItems').get(),
  ]);

  const totalPV = portfolioItemsSnapshot.docs.reduce(
    (sum: number, doc: any) => sum + (doc.data().totalPV || 0),
    0
  );

  const recentPortfolios = portfoliosSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json({
    totalProducts: productsSnapshot.size,
    totalPortfolios: (await db.collection('portfolios').get()).size,
    totalPV,
    recentPortfolios,
  });
}));

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
      status: 404,
    },
  });
});

app.use(errorHandler);

app.listen(config.PORT, () => {
  logger.info(`Server running on http://localhost:${config.PORT}`);
});
