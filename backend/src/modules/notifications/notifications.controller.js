import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as notificationsService from './notifications.service.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const result = await notificationsService.getNotifications(
    req.user.userId,
    parseInt(limit),
    parseInt(page)
  );

  res.json({
    success: true,
    data: result,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await notificationsService.markAsRead(notificationId, req.user.userId);

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification,
  });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationsService.markAllAsRead(req.user.userId);

  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: result,
  });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  await notificationsService.deleteNotification(notificationId, req.user.userId);

  res.json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

