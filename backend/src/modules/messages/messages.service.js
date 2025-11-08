import Message from './messages.model.js';
import Chat from '../chats/chats.model.js';
import logger from '../../config/logger.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import AppError from '../../utils/AppError.js';

export const sendMessage = async (chatId, senderId, content, messageType = 'text', mediaFile = null, replyTo = null) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  if (!chat.participants.includes(senderId)) {
    throw new AppError('You are not a participant of this chat', 403);
  }

  let media = null;
  if (mediaFile) {
    const uploadResult = await uploadToCloudinary(mediaFile, 'pingify/messages');
    media = {
      url: uploadResult.url,
      publicId: uploadResult.public_id,
      mimeType: mediaFile.mimetype,
      size: mediaFile.size,
    };
  }

  const message = new Message({
    chat: chatId,
    sender: senderId,
    content,
    messageType: media ? messageType : 'text',
    media,
    replyTo,
  });

  await message.save();

  chat.lastMessage = message._id;
  chat.updatedAt = new Date();
  await chat.save();

  await message.populate('sender', 'username email avatar');
  if (replyTo) {
    await message.populate('replyTo', 'content sender');
  }

  logger.info(`Message sent: ${message._id} in chat: ${chatId}`);

  return message;
};

export const getMessages = async (chatId, userId, limit = 50, before = null) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  if (!chat.participants.includes(userId)) {
    throw new AppError('You are not a participant of this chat', 403);
  }

  let query = { chat: chatId, deleted: false };

  if (before) {
    query._id = { $lt: before };
  }

  const messages = await Message.find(query)
    .populate('sender', 'username email avatar')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return messages.reverse();
};

export const editMessage = async (messageId, userId, newContent) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  if (message.sender.toString() !== userId) {
    throw new AppError('You can only edit your own messages', 403);
  }

  if (message.deleted) {
    throw new AppError('Cannot edit deleted message', 400);
  }

  message.content = newContent;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  await message.populate('sender', 'username email avatar');

  logger.info(`Message edited: ${messageId}`);

  return message;
};

export const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  if (message.sender.toString() !== userId) {
    throw new AppError('You can only delete your own messages', 403);
  }

  message.deleted = true;
  message.deletedAt = new Date();
  message.content = 'This message was deleted';
  await message.save();

  logger.info(`Message deleted: ${messageId}`);

  return message;
};

export const reactToMessage = async (messageId, userId, emoji) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError('Message not found', 404);
  }

  const existingReaction = message.reactions.find(
    (r) => r.user.toString() === userId && r.emoji === emoji
  );

  if (existingReaction) {
    message.reactions = message.reactions.filter(
      (r) => !(r.user.toString() === userId && r.emoji === emoji)
    );
  } else {
    message.reactions.push({ user: userId, emoji });
  }

  await message.save();
  await message.populate('reactions.user', 'username avatar');

  return message;
};

export const markAsRead = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new AppError('Chat not found', 404);
  }

  if (!chat.participants.includes(userId)) {
    throw new AppError('You are not a participant of this chat', 403);
  }

  const unreadMessages = await Message.find({
    chat: chatId,
    sender: { $ne: userId },
    readBy: { $ne: { $elemMatch: { user: userId } } },
  });

  for (const message of unreadMessages) {
    message.readBy.push({ user: userId });
    await message.save();
  }

  logger.info(`Messages marked as read in chat: ${chatId} by user: ${userId}`);

  return { count: unreadMessages.length };
};

