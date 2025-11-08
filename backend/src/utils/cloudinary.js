import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';
import logger from '../config/logger.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (file, folder = 'pingify') => {
  try {
    if (!config.cloudinary.cloudName) {
      logger.warn('Cloudinary not configured, returning mock URL');
      return {
        url: 'https://via.placeholder.com/400',
        public_id: 'mock-id',
      };
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'auto',
    });

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!config.cloudinary.cloudName) {
      return;
    }

    await cloudinary.uploader.destroy(publicId);
    logger.info(`File deleted from Cloudinary: ${publicId}`);
  } catch (error) {
    logger.error(`Cloudinary delete error: ${error.message}`);
    throw error;
  }
};

