import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
  forwardMessageSchema,
  searchMessagesSchema,
  starMessageSchema,
  clearChatSchema,
  validate,
} from './messages.validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const messagesDir = path.join(__dirname, '../../uploads/messages');

// Ensure directory exists
if (!fs.existsSync(messagesDir)) {
  fs.mkdirSync(messagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    if (!fs.existsSync(messagesDir)) {
      fs.mkdirSync(messagesDir, { recursive: true });
    }
    cb(null, messagesDir);
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

// Debug middleware to log request body (remove in production)
const debugFormData = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') {
    console.log('Request Content-Type:', req.headers['content-type']);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
  }
  next();
};

// Note: upload.single('media') must come before validate() because validation needs req.body
// which is populated by multer when processing FormData
router.post('/', authenticate, upload.single('media'), debugFormData, validate(sendMessageSchema), messagesController.sendMessage);
router.get('/chat/:chatId', authenticate, validate(getMessagesSchema), messagesController.getMessages);
router.get('/chat/:chatId/search', authenticate, validate(searchMessagesSchema), messagesController.searchMessages);
router.put('/:messageId', authenticate, validate(editMessageSchema), messagesController.editMessage);
router.delete('/:messageId', authenticate, validate(deleteMessageSchema), messagesController.deleteMessage);
router.post('/:messageId/react', authenticate, validate(reactToMessageSchema), messagesController.reactToMessage);
router.post('/:messageId/forward', authenticate, validate(forwardMessageSchema), messagesController.forwardMessage);
router.post('/:messageId/star', authenticate, validate(starMessageSchema), messagesController.starMessage);
router.post('/chat/:chatId/read', authenticate, validate(markAsReadSchema), messagesController.markAsRead);
router.delete('/chat/:chatId', authenticate, validate(clearChatSchema), messagesController.clearChat);
router.get('/starred', authenticate, messagesController.getStarredMessages);

export default router;

