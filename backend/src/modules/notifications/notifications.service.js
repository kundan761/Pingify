import Notification from './notifications.model.js';
import logger from '../../config/logger.js';
import { redisClient } from '../../config/redis.js';
import AppError from '../../utils/AppError.js';

export const createNotification = async (userId, notificationData) => {
  const { type, title, message, link, metadata } = notificationData;

  const notification = new Notification({
    user: userId,
    type,
    title,
    message,
    link,
    metadata,
  });

  await notification.save();

  await redisClient.publish('notifications', JSON.stringify({
    userId: userId.toString(),
    notification: notification.toJSON(),
  }));

  logger.info(`Notification created for user: ${userId}, type: ${type}`);

  return notification;
};

export const getNotifications = async (userId, limit = 50, page = 1) => {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await Notification.countDocuments({ user: userId });
  const unreadCount = await Notification.countDocuments({ user: userId, read: false });

  return {
    notifications,
    total,
    unreadCount,
    page,
    pages: Math.ceil(total / limit),
  };
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.user.toString() !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  logger.info(`Notification marked as read: ${notificationId}`);

  return notification;
};

export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() }
  );

  logger.info(`All notifications marked as read for user: ${userId}`);

  return { count: result.modifiedCount };
};

export const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  if (notification.user.toString() !== userId) {
    throw new AppError('Unauthorized', 403);
  }

  await Notification.findByIdAndDelete(notificationId);

  logger.info(`Notification deleted: ${notificationId}`);

  return { success: true };
};

