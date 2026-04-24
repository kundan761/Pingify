import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as notificationsController from './notifications.controller.js';

const router = express.Router();

router.get('/', authenticate, notificationsController.getNotifications);
router.put('/:notificationId/read', authenticate, notificationsController.markAsRead);
router.put('/read-all', authenticate, notificationsController.markAllAsRead);
router.delete('/:notificationId', authenticate, notificationsController.deleteNotification);

export default router;

