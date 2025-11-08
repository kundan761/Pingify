import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as usersService from './users.service.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await usersService.getProfile(req.user.userId);

  res.json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await usersService.updateProfile(
    req.user.userId,
    req.body,
    req.file
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit = 20, page = 1 } = req.query;
  const result = await usersService.searchUsers(
    q,
    req.user.userId,
    parseInt(limit),
    parseInt(page)
  );

  res.json({
    success: true,
    data: result,
  });
});

export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await usersService.blockUser(req.user.userId, userId);

  res.json({
    success: true,
    message: 'User blocked successfully',
    data: user,
  });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await usersService.unblockUser(req.user.userId, userId);

  res.json({
    success: true,
    message: 'User unblocked successfully',
    data: user,
  });
});

export const getBlockedUsers = asyncHandler(async (req, res) => {
  const blockedUsers = await usersService.getBlockedUsers(req.user.userId);

  res.json({
    success: true,
    data: blockedUsers,
  });
});

