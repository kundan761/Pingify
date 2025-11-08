import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as messagesController from './messages.controller.js';
import {
  sendMessageSchema,
  editMessageSchema,
  deleteMessageSchema,
  getMessagesSchema,
  reactToMessageSchema,
  markAsReadSchema,
  validate,
} from './messages.validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/messages'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.post('/', authenticate, validate(sendMessageSchema), upload.single('media'), messagesController.sendMessage);
router.get('/chat/:chatId', authenticate, validate(getMessagesSchema), messagesController.getMessages);
router.put('/:messageId', authenticate, validate(editMessageSchema), messagesController.editMessage);
router.delete('/:messageId', authenticate, validate(deleteMessageSchema), messagesController.deleteMessage);
router.post('/:messageId/react', authenticate, validate(reactToMessageSchema), messagesController.reactToMessage);
router.post('/chat/:chatId/read', authenticate, validate(markAsReadSchema), messagesController.markAsRead);

export default router;

