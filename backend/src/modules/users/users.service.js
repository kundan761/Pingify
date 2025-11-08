import User from '../auth/auth.model.js';
import logger from '../../config/logger.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.js';
import AppError from '../../utils/AppError.js';

export const getProfile = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user.toJSON();
};

export const updateProfile = async (userId, updateData, avatarFile) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (updateData.username && updateData.username !== user.username) {
    const existingUser = await User.findOne({ username: updateData.username });
    if (existingUser) {
      throw new AppError('Username already taken', 400);
    }
    user.username = updateData.username;
  }

  if (updateData.status !== undefined) {
    user.status = updateData.status;
  }

  if (updateData.privacy) {
    user.privacy = { ...user.privacy, ...updateData.privacy };
  }

  if (avatarFile) {
    if (user.avatar && user.avatar.includes('cloudinary')) {
      const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
      await deleteFromCloudinary(publicId);
    }

    const uploadResult = await uploadToCloudinary(avatarFile, 'pingify/avatars');
    user.avatar = uploadResult.url;
  }

  await user.save();
  logger.info(`Profile updated for user: ${userId}`);

  return user.toJSON();
};

export const searchUsers = async (query, currentUserId, limit = 20, page = 1) => {
  const skip = (page - 1) * limit;

  const users = await User.find({
    $and: [
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      },
      { _id: { $ne: currentUserId } },
    ],
  })
    .select('-password')
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await User.countDocuments({
    $and: [
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      },
      { _id: { $ne: currentUserId } },
    ],
  });

  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

export const blockUser = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    throw new AppError('Cannot block yourself', 400);
  }

  const user = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!user || !targetUser) {
    throw new AppError('User not found', 404);
  }

  if (!user.blockedUsers.includes(targetUserId)) {
    user.blockedUsers.push(targetUserId);
    await user.save();
    logger.info(`User ${currentUserId} blocked user ${targetUserId}`);
  }

  return user.toJSON();
};

export const unblockUser = async (currentUserId, targetUserId) => {
  const user = await User.findById(currentUserId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.blockedUsers = user.blockedUsers.filter(
    (id) => id.toString() !== targetUserId
  );
  await user.save();
  logger.info(`User ${currentUserId} unblocked user ${targetUserId}`);

  return user.toJSON();
};

export const getBlockedUsers = async (userId) => {
  const user = await User.findById(userId).populate('blockedUsers', 'username email avatar');
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.blockedUsers;
};

