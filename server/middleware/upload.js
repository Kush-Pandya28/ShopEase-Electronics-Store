import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 8 },
  fileFilter(req, file, cb) {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    return cb(new ApiError(400, 'Only JPG, PNG, WEBP or AVIF images are allowed'));
  },
});

export default upload;
