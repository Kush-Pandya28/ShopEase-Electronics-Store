import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import ApiError from '../utils/ApiError.js';

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );

let configured = false;
const ensureConfig = () => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(503, 'Image upload is not configured. Add Cloudinary credentials to .env');
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
};

export const uploadBuffer = (buffer, folder = 'shopease/products') => {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }] },
      (err, result) => {
        if (err) return reject(new ApiError(502, `Image upload failed: ${err.message}`));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;
  // Locally stored upload (no Cloudinary): "local:<folder>/<file>"
  if (publicId.startsWith('local:')) {
    const rel = publicId.slice(6);
    if (!/^[a-z]+\/[\w-]+\.(jpg|png|webp|avif)$/.test(rel)) return; // never touch anything outside uploads
    const { UPLOAD_ROOT } = await import('../controllers/uploadController.js');
    await fs.unlink(path.join(UPLOAD_ROOT, rel)).catch(() => {});
    return;
  }
  if (!isCloudinaryConfigured()) return;
  ensureConfig();
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Best effort: a missing remote image should not block the caller
  }
};
