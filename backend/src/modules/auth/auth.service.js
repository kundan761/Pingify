import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from './auth.model.js';
import { config } from '../../config/env.js';
import logger from '../../config/logger.js';
import { redisClient } from '../../config/redis.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/email.js';
import AppError from '../../utils/AppError.js';

export const register = async (userData) => {
  const { username, email, password } = userData;

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new AppError('User with this email or username already exists', 400);
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = new User({
    username,
    email,
    password,
    emailVerificationToken,
    emailVerificationExpires,
  });

  await user.save();

  try {
    await sendVerificationEmail(email, emailVerificationToken);
  } catch (error) {
    logger.error(`Failed to send verification email: ${error.message}`);
  }

  logger.info(`New user registered: ${email}`);

  const tokens = generateTokens(user);

  return {
    user: user.toJSON(),
    ...tokens,
  };
};

export const login = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  await redisClient.setEx(`user:${user._id}:online`, 3600, 'true');

  logger.info(`User logged in: ${email}`);

  const tokens = generateTokens(user);

  return {
    user: user.toJSON(),
    ...tokens,
  };
};

export const logout = async (userId, token) => {
  const user = await User.findById(userId);
  if (user) {
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
  }

  await redisClient.del(`user:${userId}:online`);
  await redisClient.setEx(`blacklist:${token}`, 900, 'true');

  logger.info(`User logged out: ${userId}`);
};

export const refreshToken = async (refreshToken) => {
  try {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const tokens = generateTokens(user);

    return tokens;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid refresh token', 401);
    }
    throw new AppError(error.message || 'Invalid refresh token', 401);
  }
};

export const verifyEmail = async (token) => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info(`Email verified for user: ${user.email}`);

  return user.toJSON();
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    return;
  }

  const passwordResetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save();

  try {
    await sendPasswordResetEmail(email, passwordResetToken);
    logger.info(`Password reset email sent to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email: ${error.message}`);
  }
};

export const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info(`Password reset for user: ${user.email}`);
};

const generateTokens = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire,
  });

  return {
    accessToken,
    refreshToken,
  };
};

