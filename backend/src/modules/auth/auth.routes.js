import express from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';
import {
  sendOtpSchema,
  verifyOtpSchema,
  validate,
} from './auth.validation.js';

const router = express.Router();

router.post('/send-otp', authLimiter, validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh-token', authController.refreshToken);

export default router;
