import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirs = [
  path.join(__dirname, '../uploads/avatars'),
  path.join(__dirname, '../uploads/messages'),
  path.join(__dirname, '../uploads/groups'),
  path.join(__dirname, '../uploads/files'),
];

export const ensureUploadDirs = () => {
  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created upload directory: ${dir}`);
    }
  });
};

