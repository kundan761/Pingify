import Chat from './chats.model.js';
import User from '../auth/auth.model.js';
import Group from '../groups/groups.model.js';
import logger from '../../config/logger.js';
import AppError from '../../utils/AppError.js';

export const createChat = async (userId, participantId) => {
  if (userId === participantId) {
    throw new AppError('Cannot create chat with yourself', 400);
  }

  const participant = await User.findById(participantId);
  if (!participant) {
    throw new AppError('Participant not found', 404);
  }

  const existingChat = await Chat.findOne({
    chatType: 'private',
    participants: { $all: [userId, participantId] },
  });

  if (existingChat) {
    await existingChat.populate('participants', 'username email avatar isOnline lastSeen');
    await existingChat.populate('lastMessage');
    return existingChat;
  }

  const chat = new Chat({
    participants: [userId, participantId],
    chatType: 'private',
  });

  await chat.save();
  await chat.populate('participants', 'username email avatar isOnline lastSeen');

  logger.info(`Chat created: ${chat._id} between ${userId} and ${participantId}`);

  return chat;
};

export const getChat = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  if (!chat.participants.includes(userId)) {
    throw new AppError('You are not a participant of this chat', 403);
  }

  await chat.populate('participants', 'username email avatar isOnline lastSeen');
  await chat.populate('lastMessage');

  // Populate group information for group chats
  if (chat.chatType === 'group') {
    const group = await Group.findOne({ chat: chat._id });
    if (group) {
      chat.name = group.name;
      chat.avatar = group.avatar;
      chat.description = group.description;
    }
  }

  return chat;
};

export const getChats = async (userId, limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const chats = await Chat.find({
    participants: userId,
  })
    .populate('participants', 'username email avatar isOnline lastSeen')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  // Populate group information for group chats
  for (const chat of chats) {
    if (chat.chatType === 'group') {
      const group = await Group.findOne({ chat: chat._id }).lean();
      if (group) {
        chat.name = group.name;
        chat.avatar = group.avatar;
        chat.description = group.description;
      }
    }
  }

  const total = await Chat.countDocuments({
    participants: userId,
  });

  return {
    chats,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

export const deleteChat = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  if (!chat.participants.includes(userId)) {
    throw new AppError('You are not a participant of this chat', 403);
  }

  await Chat.findByIdAndDelete(chatId);
  logger.info(`Chat deleted: ${chatId} by user: ${userId}`);

  return { success: true };
};

