import nodemailer from 'nodemailer';
import logger from '../config/logger.js';
import { config } from '../config/env.js';

const transporter = nodemailer.createTransport({
  service: config.email.service,
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port == 465,
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

export const sendOtpEmail = async (email, otp) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #00A884 0%, #06CF9C 100%); padding: 32px 24px; text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <span style="font-size: 28px;">💬</span>
        </div>
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">Pingify</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 4px 0 0;">Secure Login Verification</p>
      </div>
      <div style="padding: 32px 24px; text-align: center;">
        <p style="color: #667781; font-size: 15px; margin: 0 0 24px; line-height: 1.5;">
          Use the following code to verify your identity. This code is valid for <strong style="color: #111B21;">5 minutes</strong>.
        </p>
        <div style="background: #F0F2F5; border-radius: 12px; padding: 20px; margin: 0 auto; display: inline-block;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111B21;">${otp}</span>
        </div>
        <p style="color: #667781; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
      <div style="background: #F0F2F5; padding: 16px 24px; text-align: center;">
        <p style="color: #8696A0; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Pingify — Secure Messaging
        </p>
      </div>
    </div>
  `;
  
  return sendEmail(email, `${otp} is your Pingify verification code`, html);
};
