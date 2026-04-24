import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as usersController from './users.controller.js';
import {
  updateProfileSchema,
  blockUserSchema,
  searchUsersSchema,
  parseFormData,
  validate,
} from './users.validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsDir = path.join(__dirname, '../../uploads/avatars');

// Ensure directory exists
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

const router = express.Router();

router.get('/profile', authenticate, usersController.getProfile);
router.get('/:userId/public-key', authenticate, usersController.getPublicKey);
// Note: upload.single('avatar') must come before validate() because validation needs req.body
// which is populated by multer when processing FormData
// parseFormData parses JSON strings from FormData before validation
router.put('/profile', authenticate, upload.single('avatar'), parseFormData, validate(updateProfileSchema), usersController.updateProfile);
router.get('/search', authenticate, validate(searchUsersSchema), usersController.searchUsers);
router.post('/block/:userId', authenticate, validate(blockUserSchema), usersController.blockUser);
router.post('/unblock/:userId', authenticate, validate(blockUserSchema), usersController.unblockUser);
router.get('/blocked', authenticate, usersController.getBlockedUsers);

export default router;

