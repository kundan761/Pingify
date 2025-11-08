import express from 'express';
import multer from 'multer';
import path from 'path';
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
  validate,
} from './groups.validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/groups'));
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

router.post('/', authenticate, validate(createGroupSchema), upload.single('avatar'), groupsController.createGroup);
router.get('/my-groups', authenticate, groupsController.getMyGroups);
router.get('/:groupId', authenticate, validate(getGroupSchema), groupsController.getGroup);
router.put('/:groupId', authenticate, validate(updateGroupSchema), upload.single('avatar'), groupsController.updateGroup);
router.post('/:groupId/members', authenticate, validate(addMembersSchema), groupsController.addMembers);
router.delete('/:groupId/members/:userId', authenticate, validate(removeMemberSchema), groupsController.removeMember);
router.post('/:groupId/moderators/:userId', authenticate, validate(promoteToModeratorSchema), groupsController.promoteToModerator);
router.post('/:groupId/leave', authenticate, validate(getGroupSchema), groupsController.leaveGroup);

export default router;

