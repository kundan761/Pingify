import express from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as chatsController from './chats.controller.js';
import {
  createChatSchema,
  getChatSchema,
  getChatsSchema,
  validate,
} from './chats.validation.js';

const router = express.Router();

router.post('/', authenticate, validate(createChatSchema), chatsController.createChat);
router.get('/', authenticate, validate(getChatsSchema), chatsController.getChats);
router.get('/:chatId', authenticate, validate(getChatSchema), chatsController.getChat);
router.delete('/:chatId', authenticate, validate(getChatSchema), chatsController.deleteChat);

export default router;

