import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import { config } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    if (!config.email.user || !config.email.pass) {
      logger.warn('Email credentials not configured, skipping email send');
      return;
    }

    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Email send error: ${error.message}`);
    throw error;
  }
};

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${config.frontend.url}/auth/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;
  
  return sendEmail(email, 'Verify Your Email - Pingify', html);
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${config.frontend.url}/auth/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;
  
  return sendEmail(email, 'Reset Your Password - Pingify', html);
};

