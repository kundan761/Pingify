import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as chatsService from './chats.service.js';

export const createChat = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  const chat = await chatsService.createChat(req.user.userId, participantId);

  res.status(201).json({
    success: true,
    message: 'Chat created successfully',
    data: chat,
  });
});

export const getChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const chat = await chatsService.getChat(chatId, req.user.userId);

  res.json({
    success: true,
    data: chat,
  });
});

export const getChats = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const result = await chatsService.getChats(req.user.userId, parseInt(limit), parseInt(page));

  res.json({
    success: true,
    data: result,
  });
});

export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  await chatsService.deleteChat(chatId, req.user.userId);

  res.json({
    success: true,
    message: 'Chat deleted successfully',
  });
});

