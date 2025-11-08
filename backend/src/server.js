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

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      config.cors.origin,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Set IO instance for use in other modules
setIO(io);

io.use(socketAuthenticate);

io.on('connection', (socket) => {
  const userId = socket.user.userId;

  logger.info(`User connected: ${userId}, Socket: ${socket.id}`);

  socket.emit('connected', { message: 'Connected to server' });

  socket.on('join-chat', async (chatId) => {
    try {
      const chat = await Chat.findById(chatId);
      if (chat && chat.participants.includes(userId)) {
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
    if (chat && chat.participants.includes(userId)) {
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
    if (chat && chat.participants.includes(userId)) {
      socket.to(`chat:${chatId}`).emit('typing', {
        userId,
        chatId,
        isTyping: false,
      });
    }
  });

  // Note: Messages are sent via API endpoint, socket only receives and broadcasts
  // This ensures proper validation and error handling

  socket.on('mark-read', async (data) => {
    try {
      const { chatId } = data;
      const chat = await Chat.findById(chatId);
      if (chat && chat.participants.includes(userId)) {
        const unreadMessages = await Message.find({
          chat: chatId,
          sender: { $ne: userId },
          readBy: { $ne: { $elemMatch: { user: userId } } },
        });

        for (const message of unreadMessages) {
          message.readBy.push({ user: userId });
          await message.save();
        }

        socket.to(`chat:${chatId}`).emit('messages-read', {
          chatId,
          userId,
        });
      }
    } catch (error) {
      logger.error(`Mark read error: ${error.message}`);
    }
  });

  socket.on('disconnect', async () => {
    await redisClient.del(`user:${userId}:online`);
    logger.info(`User disconnected: ${userId}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

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

