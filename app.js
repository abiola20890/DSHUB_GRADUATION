
import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import morgan        from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import path          from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { globalLimiter }   from './src/config/rateLimiter.js';
import authRouter          from './src/routes/auth.route.js';
import internRouter        from './src/routes/intern.route.js';
import testimonialRouter   from './src/routes/testimonial.route.js';
import milestoneRouter     from './src/routes/milestone.route.js';
import mediaRouter         from './src/routes/media.route.js';
import analyticsRouter     from './src/routes/analytics.route.js';
import { errorHandler, notFound } from './src/middlewares/errorHandler.js';
import setupSwagger from './src/config/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app        = express();
const API_PREFIX = '/api/v1';


app.use(helmet({ crossOriginResourcePolicy: false }));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman, curl, server-to-server
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' is not allowed.`));
  },
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(mongoSanitize()); // strips $ and . from req.body, query, params


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const logsDir = path.join(__dirname, 'logs');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Access log stream (all requests)
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

// Error log stream (4xx and 5xx only)
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Log ALL requests to access.log
app.use(
  morgan('combined', {
    stream: accessLogStream,
  })
);

// Log ONLY errors to error.log
app.use(
  morgan('combined', {
    stream: errorLogStream,
    skip: (_req, res) => res.statusCode < 400,
  })
);

// Optional: log to terminal in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(globalLimiter); // covers all routes — route-specific limiters applied in route files


app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag:   true,
}));


app.get('/health', (_req, res) => {
  res.status(200).json({
    success:     true,
    message:     'DSHub Graduation API is running.',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});


app.use(`${API_PREFIX}/auth`,         authRouter);
app.use(`${API_PREFIX}/interns`,      internRouter);
app.use(`${API_PREFIX}/testimonials`, testimonialRouter);
app.use(`${API_PREFIX}/milestones`,   milestoneRouter);
app.use(`${API_PREFIX}/media`,        mediaRouter);
app.use(`${API_PREFIX}/analytics`,    analyticsRouter);


setupSwagger(app); // http://localhost:9000/api-docs


app.use(notFound);     // 404 for unmatched routes
app.use(errorHandler); // global error handler

export default app;