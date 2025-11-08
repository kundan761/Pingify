import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary.js';
import logger from '../../config/logger.js';

export const uploadFile = async (file, folder = 'pingify/files') => {
  try {
    const result = await uploadToCloudinary(file, folder);
    logger.info(`File uploaded: ${result.public_id}`);
    return result;
  } catch (error) {
    logger.error(`File upload error: ${error.message}`);
    throw error;
  }
};

export const deleteFile = async (publicId) => {
  try {
    await deleteFromCloudinary(publicId);
    logger.info(`File deleted: ${publicId}`);
    return { success: true };
  } catch (error) {
    logger.error(`File delete error: ${error.message}`);
    throw error;
  }
};

