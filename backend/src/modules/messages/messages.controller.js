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

  // Emit socket event to all participants
  try {
    const io = getIO();
    const chat = await Chat.findById(chatId);
    if (chat) {
      io.to(`chat:${chatId}`).emit('new-message', message.toJSON());

      // Create notifications for other participants
      const otherParticipants = chat.participants.filter(
        (p) => p.toString() !== req.user.userId
      );

      for (const participantId of otherParticipants) {
        await notificationsService.createNotification(participantId, {
          type: 'message',
          title: 'New Message',
          message: `${req.user.email} sent you a message`,
          link: `/chat/${chatId}`,
          metadata: { chatId, messageId: message._id },
        });
      }
    }
  } catch (error) {
    logger.error(`Error emitting socket event: ${error.message}`);
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message,
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

  res.json({
    success: true,
    message: 'Message edited successfully',
    data: message,
  });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await messagesService.deleteMessage(messageId, req.user.userId);

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

  res.json({
    success: true,
    data: message,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const result = await messagesService.markAsRead(chatId, req.user.userId);

  res.json({
    success: true,
    message: 'Messages marked as read',
    data: result,
  });
});

