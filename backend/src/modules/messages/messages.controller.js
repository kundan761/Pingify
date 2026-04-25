import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as messagesService from './messages.service.js';
import { getIO } from '../../utils/socket.js';
import Chat from '../chats/chats.model.js';
import * as notificationsService from '../notifications/notifications.service.js';
import logger from '../../config/logger.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, messageType, replyTo } = req.body;
  const message = await messagesService.sendMessage(
    chatId,
    req.user.userId,
    content,
    messageType,
    req.file,
    replyTo
  );

  // Convert to plain object with populated fields
  const messageData = message.toObject ? message.toObject() : message;

  // Emit socket event to all participants
  try {
    const io = getIO();
    const chat = await Chat.findById(chatId);
    if (chat) {
      io.to(`chat:${chatId}`).emit('new-message', messageData);

      // Create notifications for other participants
      for (const participantId of chat.participants) {
        const pId = participantId.toString();
        io.to(`user:${pId}`).emit('new-message', messageData);
        
        if (pId !== req.user.userId) {
          const notificationTitle = chat.chatType === 'group' ? chat.name : 'New Message';
          const notificationMessage = chat.chatType === 'group' 
            ? `${req.user.username} in ${chat.name}: ${message.content.substring(0, 50)}`
            : `${req.user.username}: ${message.content.substring(0, 50)}`;

          await notificationsService.createNotification(participantId, {
            type: 'message',
            title: notificationTitle,
            message: notificationMessage,
            link: `/chat/${chatId}`,
            metadata: { chatId, messageId: message._id },
          });
        }
      }
    }
  } catch (error) {
    logger.error(`Error emitting socket event: ${error.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: messageData,
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { limit = 50, before } = req.query;
  const messages = await messagesService.getMessages(
    chatId,
    req.user.userId,
    parseInt(limit),
    before
  );

  res.json({
    success: true,
    data: messages,
  });
});

export const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const message = await messagesService.editMessage(messageId, req.user.userId, content);

  try {
    const io = getIO();
    io.to(`chat:${message.chat}`).emit('message-updated', message);
  } catch (error) {
    logger.error(`Error emitting edit socket event: ${error.message}`);
  }

  res.json({
    success: true,
    message: 'Message edited successfully',
    data: message,
  });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await messagesService.deleteMessage(messageId, req.user.userId);

  try {
    const io = getIO();
    io.to(`chat:${message.chat}`).emit('message-updated', message);
  } catch (error) {
    logger.error(`Error emitting delete socket event: ${error.message}`);
  }

  res.json({
    success: true,
    message: 'Message deleted successfully',
    data: message,
  });
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const message = await messagesService.reactToMessage(messageId, req.user.userId, emoji);

  try {
    const io = getIO();
    io.to(`chat:${message.chat}`).emit('message-updated', message);
  } catch (error) {
    logger.error(`Error emitting react socket event: ${error.message}`);
  }

  res.json({
    success: true,
    data: message,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await messagesService.markAsRead(chatId, req.user.userId);

  try {
    const io = getIO();
    io.to(`chat:${chatId}`).emit('messages-read', { chatId, userId: req.user.userId });
  } catch (error) {
    logger.error(`Error emitting markAsRead socket event: ${error.message}`);
  }

  res.json({
    success: true,
    message: 'Messages marked as read',
    data: result,
  });
});

export const forwardMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { targetChatIds } = req.body;
  const forwardedMessages = await messagesService.forwardMessage(
    messageId,
    req.user.userId,
    targetChatIds
  );

  // Emit socket events for forwarded messages
  try {
    const io = getIO();
    for (const message of forwardedMessages) {
      const messageData = message.toObject ? message.toObject() : message;
      io.to(`chat:${message.chat}`).emit('new-message', messageData);
      
      const chat = await Chat.findById(message.chat);
      if (chat) {
        for (const participantId of chat.participants) {
          io.to(`user:${participantId.toString()}`).emit('new-message', messageData);
        }
      }
    }
  } catch (error) {
    logger.error(`Error emitting socket event: ${error.message}`);
  }

  res.json({
    success: true,
    message: 'Message forwarded successfully',
    data: forwardedMessages,
  });
});

export const searchMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { q, limit = 50 } = req.query;
  const messages = await messagesService.searchMessages(
    chatId,
    req.user.userId,
    q,
    parseInt(limit)
  );

  res.json({
    success: true,
    data: messages,
  });
});

export const starMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const result = await messagesService.starMessage(messageId, req.user.userId);

  res.json({
    success: true,
    message: result.starred ? 'Message starred' : 'Message unstarred',
    data: result,
  });
});

export const getStarredMessages = asyncHandler(async (req, res) => {
  const messages = await messagesService.getStarredMessages(req.user.userId);

  res.json({
    success: true,
    data: messages,
  });
});

export const clearChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await messagesService.clearChat(chatId, req.user.userId);

  // Emit socket event to notify all participants
  try {
    const io = getIO();
    io.to(`chat:${chatId}`).emit('chat-cleared', { chatId });
  } catch (error) {
    logger.error(`Error emitting socket event: ${error.message}`);
  }

  res.json({
    success: true,
    message: 'Chat cleared successfully',
    data: result,
  });
});

