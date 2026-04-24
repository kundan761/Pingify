import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as groupsController from './groups.controller.js';
import {
  createGroupSchema,
  updateGroupSchema,
  addMembersSchema,
  removeMemberSchema,
  promoteToModeratorSchema,
  getGroupSchema,
  deleteGroupSchema,
  transferAdminSchema,
  demoteModeratorSchema,
  validate,
  parseFormData,
} from './groups.validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const groupsDir = path.join(__dirname, '../../uploads/groups');

// Ensure directory exists
if (!fs.existsSync(groupsDir)) {
  fs.mkdirSync(groupsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    if (!fs.existsSync(groupsDir)) {
      fs.mkdirSync(groupsDir, { recursive: true });
    }
    cb(null, groupsDir);
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

// Note: upload.single('avatar') must come before validate() because validation needs req.body
// which is populated by multer when processing FormData
// parseFormData parses JSON strings from FormData before validation
router.post('/', authenticate, upload.single('avatar'), parseFormData, validate(createGroupSchema), groupsController.createGroup);
router.get('/my-groups', authenticate, groupsController.getMyGroups);
router.get('/:groupId', authenticate, validate(getGroupSchema), groupsController.getGroup);
// Note: upload.single('avatar') must come before validate() because validation needs req.body
// which is populated by multer when processing FormData
// parseFormData parses JSON strings from FormData before validation
router.put('/:groupId', authenticate, upload.single('avatar'), parseFormData, validate(updateGroupSchema), groupsController.updateGroup);
router.post('/:groupId/members', authenticate, validate(addMembersSchema), groupsController.addMembers);
router.delete('/:groupId/members/:userId', authenticate, validate(removeMemberSchema), groupsController.removeMember);
router.post('/:groupId/moderators/:userId', authenticate, validate(promoteToModeratorSchema), groupsController.promoteToModerator);
router.delete('/:groupId/moderators/:userId', authenticate, validate(demoteModeratorSchema), groupsController.demoteModerator);
router.post('/:groupId/transfer-admin', authenticate, validate(transferAdminSchema), groupsController.transferAdmin);
router.post('/:groupId/leave', authenticate, validate(getGroupSchema), groupsController.leaveGroup);
router.delete('/:groupId', authenticate, validate(deleteGroupSchema), groupsController.deleteGroup);

export default router;

