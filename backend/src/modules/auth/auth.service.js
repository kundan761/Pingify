import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from './auth.model.js';
import { config } from '../../config/env.js';
import logger from '../../config/logger.js';
import { redisClient } from '../../config/redis.js';
import { sendOtpEmail } from '../../utils/email.js';
import AppError from '../../utils/AppError.js';

const generateRSAKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
};

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60; // 1 minute between resends

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (email, username) => {
  // Check cooldown to prevent spam
  const cooldownKey = `otp:cooldown:${email}`;
  const hasCooldown = await redisClient.get(cooldownKey);
  if (hasCooldown) {
    throw new AppError('Please wait before requesting another OTP', 429);
  }

  // If username is provided, it's a signup flow
  if (username) {
    const existingUser = await User.findOne({
      $or: [{ username }],
    });

    if (existingUser) {
      // Check if it's the same email — if so, treat as login
      if (existingUser.email === email.toLowerCase()) {
        // This is fine, treat as login
      } else {
        throw new AppError('Username is already taken', 400);
      }
    }

    // Also check if there's a different user with this email
    const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
    if (existingEmailUser && existingEmailUser.username !== username) {
      throw new AppError('An account with this email already exists', 400);
    }

    // Store pending signup data in Redis
    await redisClient.setEx(
      `otp:signup:${email}`,
      OTP_EXPIRY_SECONDS,
      JSON.stringify({ username, email })
    );
  }

  // Generate OTP
  const otp = generateOtp();

  // Store OTP in Redis with expiry
  await redisClient.setEx(`otp:${email}`, OTP_EXPIRY_SECONDS, otp);

  // Reset attempt counter
  await redisClient.setEx(`otp:attempts:${email}`, OTP_EXPIRY_SECONDS, '0');

  // Set cooldown
  await redisClient.setEx(cooldownKey, OTP_COOLDOWN_SECONDS, 'true');

  // Send OTP email
  try {
    await sendOtpEmail(email, otp);
    logger.info(`OTP sent to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send OTP email: ${error.message}`);
    // Log OTP to console as fallback in development
    if (config.nodeEnv === 'development') {
      logger.info(`[DEV] OTP for ${email}: ${otp}`);
    }
  }

  return { message: 'OTP sent successfully' };
};

export const verifyOtp = async (email, otp) => {
  // Check attempt counter
  const attemptsKey = `otp:attempts:${email}`;
  const attempts = parseInt(await redisClient.get(attemptsKey)) || 0;

  if (attempts >= MAX_OTP_ATTEMPTS) {
    // Clean up OTP data
    await redisClient.del(`otp:${email}`);
    await redisClient.del(attemptsKey);
    await redisClient.del(`otp:signup:${email}`);
    throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
  }

  // Get stored OTP
  const storedOtp = await redisClient.get(`otp:${email}`);

  if (!storedOtp) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  if (storedOtp !== otp) {
    // Increment attempt counter
    await redisClient.incr(attemptsKey);
    throw new AppError('Invalid OTP. Please try again.', 400);
  }

  // OTP is valid — check if this is a signup or login
  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Check for pending signup data
    const signupDataStr = await redisClient.get(`otp:signup:${email}`);

    if (!signupDataStr) {
      throw new AppError('No account found with this email. Please sign up first.', 404);
    }

    const signupData = JSON.parse(signupDataStr);

    const keys = generateRSAKeyPair();

    // Create new user
    user = new User({
      username: signupData.username,
      email: signupData.email,
      isEmailVerified: true,
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    });

    await user.save();
    logger.info(`New user registered via OTP: ${email}`);
  }

  if (!user.privateKey || !user.publicKey) {
    const keys = generateRSAKeyPair();
    user.publicKey = keys.publicKey;
    user.privateKey = keys.privateKey;
  }

  // Update last seen
  user.lastSeen = new Date();
  user.isEmailVerified = true;
  await user.save();

  // Clean up Redis
  await redisClient.del(`otp:${email}`);
  await redisClient.del(attemptsKey);
  await redisClient.del(`otp:signup:${email}`);
  await redisClient.del(`otp:cooldown:${email}`);

  logger.info(`User authenticated via OTP: ${email}`);

  const tokens = generateTokens(user);

  return {
    user: user.toJSON(),
    privateKey: user.privateKey,
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

export const refreshToken = async (refreshTokenValue) => {
  try {
    if (!refreshTokenValue) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = jwt.verify(refreshTokenValue, config.jwt.refreshSecret);
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
