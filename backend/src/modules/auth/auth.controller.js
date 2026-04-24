import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as authService from './auth.service.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { email, username } = req.body;
  const result = await authService.sendOtp(email, username);

  res.json({
    success: true,
    message: result.message,
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOtp(email, otp);

  res.json({
    success: true,
    message: 'Authentication successful',
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
