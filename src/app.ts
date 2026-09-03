import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import passport from 'passport';
import config from './config/index';
import './config/passport.js';
import { globalErrorHandler } from './middlewares/global-error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { apiRouter } from './routes/index.js';

const app: Application = express();

app.disable('x-powered-by');

// Security & utility middlewares
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: [config.frontend_url || 'http://localhost:3000', 'http://localhost:3000'],
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(passport.initialize());

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

// Root route
app.get('/', (_req, res) => res.json({ success: true, message: 'Server is running' }));

// Application routes
app.use('/api/v1', apiRouter);

// Error handling middlewares
app.use(notFound);
app.use(globalErrorHandler);

export default app;
