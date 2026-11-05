import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { databaseStatus } from './db.js';
import { errorHandler, notFound } from './lib/http.js';
import { readSession } from './lib/session.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { bookingsRouter } from './modules/bookings/bookings.routes.js';
import { eventsRouter } from './modules/events/events.routes.js';
import { newsletterRouter } from './modules/newsletter/newsletter.routes.js';

export function buildApp() {
  const app = express();
  app.set('trust proxy', true); // behind Render's proxy and Vercel's /api rewrite
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.allowedOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`));
    next();
  });

  app.get('/', (_req, res) => res.json({ service: 'EventSphere API', docs: '/api/health' }));
  app.get('/api/health', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ok: true, database: databaseStatus(), uptime: Math.round(process.uptime()) });
  });

  app.use('/api', readSession);
  app.use('/api/events', eventsRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/newsletter', newsletterRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
