import { asyncHandler } from '../../middlewares/error.middleware.js';
import * as filesService from './files.service.js';

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const result = await filesService.uploadFile(req.file);

  res.json({
    success: true,
    message: 'File uploaded successfully',
    data: result,
  });
});

export const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  await filesService.deleteFile(publicId);

  res.json({
    success: true,
    message: 'File deleted successfully',
  });
});

