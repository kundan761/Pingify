import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/env.js';
import logger from './config/logger.js';
import connectDB from './config/db.js';
import { connectRedis, redisClient } from './config/redis.js';
import { socketAuthenticate } from './middlewares/auth.middleware.js';
import Chat from './modules/chats/chats.model.js';
import Message from './modules/messages/messages.model.js';
import { setIO } from './utils/socket.js';
import { ensureUploadDirs } from './utils/ensureUploadDirs.js';

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = config.cors.origin ? config.cors.origin.split(',').map(o => o.trim()) : [];
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

setIO(io);

io.use(socketAuthenticate);

const socketCount = async (userId) => {
  const sockets = await io.in(`user:${userId}`).fetchSockets();
  return sockets.length;
};

io.on('connection', async (socket) => {
  const userId = socket.user.userId;

  logger.info(`User connected: ${userId}, Socket: ${socket.id}`);

  socket.join(`user:${userId}`);
  logger.info(`User ${userId} joined personal room`);

  // Join all chat rooms the user is part of for instant notifications/updates
  try {
    const userChats = await Chat.find({ participants: userId });
    userChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });
    logger.info(`User ${userId} joined ${userChats.length} chat rooms`);

    // Online status management
    const activeConnections = await socketCount(userId);
    if (activeConnections === 1) {
      const User = (await import('./modules/auth/auth.model.js')).default;
      const user = await User.findById(userId);
      if (user) {
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();
        io.emit('user-online', { userId: userId.toString() });
        logger.info(`User ${userId} is now online (broadcasted)`);
      }
    }
  } catch (error) {
    logger.error(`Error in socket connection setup: ${error.message}`);
  }

  socket.emit('connected', { message: 'Connected to server' });

  socket.on('join-chat', async (chatId) => {
    try {
      const chat = await Chat.findById(chatId);
      if (chat && chat.participants.some(p => p.toString() === userId)) {
        socket.join(`chat:${chatId}`);
        logger.info(`User ${userId} joined chat: ${chatId}`);
      }
    } catch (error) {
      logger.error(`Error joining chat: ${error.message}`);
    }
  });

  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat:${chatId}`);
    logger.info(`User ${userId} left chat: ${chatId}`);
  });

  socket.on('typing', async (data) => {
    const { chatId } = data;
    const chat = await Chat.findById(chatId);
    if (chat && chat.participants.some(p => p.toString() === userId)) {
      socket.to(`chat:${chatId}`).emit('typing', {
        userId,
        chatId,
        isTyping: true,
      });
    }
  });

  socket.on('stop-typing', async (data) => {
    const { chatId } = data;
    const chat = await Chat.findById(chatId);
    if (chat && chat.participants.some(p => p.toString() === userId)) {
      socket.to(`chat:${chatId}`).emit('typing', {
        userId,
        chatId,
        isTyping: false,
      });
    }
  });


  socket.on('mark-delivered', async (data) => {
    try {
      const { messageIds, chatId } = data;
      if (!messageIds || !Array.isArray(messageIds)) return;

      for (const messageId of messageIds) {
        const message = await Message.findById(messageId);
        if (message && !message.deliveredTo.some(d => d.user.toString() === userId)) {
          message.deliveredTo.push({ user: userId });
          await message.save();
          
          socket.to(`user:${message.sender}`).emit('message-delivered', {
            messageId,
            chatId,
            userId,
            deliveredAt: new Date(),
          });
        }
      }
    } catch (error) {
      logger.error(`Mark delivered error: ${error.message}`);
    }
  });

  socket.on('mark-read', async (data) => {
    try {
      const { chatId } = data;
      const chat = await Chat.findById(chatId);
      if (chat && chat.participants.some(p => p.toString() === userId)) {
        const unreadMessages = await Message.find({
          chat: chatId,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId },
        });

        for (const message of unreadMessages) {
          let updated = false;
          if (!message.readBy.some(r => r.user.toString() === userId)) {
            message.readBy.push({ user: userId });
            updated = true;
          }
          if (!message.deliveredTo.some(d => d.user.toString() === userId)) {
            message.deliveredTo.push({ user: userId });
            updated = true;
          }
          if (updated) await message.save();
        }

        socket.to(`chat:${chatId}`).emit('messages-read', {
          chatId,
          userId,
        });
        socket.to(`chat:${chatId}`).emit('messages-delivered', {
          chatId,
          userId,
        });
      }
    } catch (error) {
      logger.error(`Mark read error: ${error.message}`);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const activeConnections = await socketCount(userId);
      
      if (activeConnections === 0) {
        await redisClient.del(`user:${userId}:online`);
        
        const User = (await import('./modules/auth/auth.model.js')).default;
        const user = await User.findById(userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
          
          if (user.privacy?.showOnlineStatus !== false) {
            io.emit('user-offline', { userId: userId.toString() });
          }
        }
      }
    } catch (error) {
      logger.error(`Error updating user offline status: ${error.message}`);
    }
    
    logger.info(`User disconnected: ${userId}`);
  });
});

const startServer = async () => {
  try {
    ensureUploadDirs();
    
    await connectDB();
    await connectRedis();

    try {
      const User = (await import('./modules/auth/auth.model.js')).default;
      await User.updateMany({ isOnline: true }, { $set: { isOnline: false } });
      logger.info('Reset all users online status to false');
    } catch (error) {
      logger.error(`Failed to reset online status on startup: ${error.message}`);
    }

    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export { io };

