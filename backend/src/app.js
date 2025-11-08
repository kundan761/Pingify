import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { config } from './config/env.js';
import logger from './config/logger.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/rateLimiter.middleware.js';

import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import chatsRoutes from './modules/chats/chats.routes.js';
import messagesRoutes from './modules/messages/messages.routes.js';
import groupsRoutes from './modules/groups/groups.routes.js';
import notificationsRoutes from './modules/notifications/notifications.routes.js';
import filesRoutes from './modules/files/files.routes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      config.cors.origin,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/chats', apiLimiter, chatsRoutes);
app.use('/api/messages', apiLimiter, messagesRoutes);
app.use('/api/groups', apiLimiter, groupsRoutes);
app.use('/api/notifications', apiLimiter, notificationsRoutes);
app.use('/api/files', apiLimiter, filesRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;

