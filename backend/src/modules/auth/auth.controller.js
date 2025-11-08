import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as authService from './auth.service.js';
import logger from '../../config/logger.js';

export const register = asyncHandler(async (req, res) => {
  const userData = req.body;
  const result = await authService.register(userData);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your email.',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  await authService.logout(req.user.userId, token);

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);

  res.json({
    success: true,
    data: tokens,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const user = await authService.verifyEmail(token);

  res.json({
    success: true,
    message: 'Email verified successfully',
    data: user,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});

