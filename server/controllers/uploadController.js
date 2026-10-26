import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uploadBuffer, deleteImage, isCloudinaryConfigured } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', 'uploads');

const FOLDERS = ['products', 'categories', 'brands', 'banners', 'reviews', 'avatars'];
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif' };

/** Checks the real file signature, not just the browser-supplied type. */
const looksLikeImage = (buf) =>
  (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) || // JPEG
  buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || // PNG
  (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') || // WEBP
  buf.subarray(4, 12).toString().startsWith('ftypavi'); // AVIF

/** Without Cloudinary keys, images are stored in server/uploads and served from /api/uploads. */
const saveLocally = async (file, folder, req) => {
  const name = `${crypto.randomUUID()}${EXT[file.mimetype] || '.jpg'}`;
  await fs.mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_ROOT, folder, name), file.buffer);
  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  return { url: `${base}/api/uploads/${folder}/${name}`, publicId: `local:${folder}/${name}` };
};

const store = async (req, folder) => {
  if (!req.files?.length) throw new ApiError(400, 'No images received');
  if (req.files.some((f) => !looksLikeImage(f.buffer)))
    throw new ApiError(400, 'One of the files is not a valid image');
  return Promise.all(
    req.files.map((f) =>
      isCloudinaryConfigured() ? uploadBuffer(f.buffer, `shopease/${folder}`) : saveLocally(f, folder, req)
    )
  );
};

// POST /api/upload?folder=products   (admin, multipart field: images)
export const uploadImages = asyncHandler(async (req, res) => {
  const folder = FOLDERS.includes(req.query.folder) ? req.query.folder : 'products';
  res.status(201).json({ success: true, images: await store(req, folder) });
});

// POST /api/upload/review   (any logged-in customer, up to 4 photos for a review)
export const uploadReviewImages = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, images: await store(req, 'reviews') });
});

// DELETE /api/upload  { publicId }
export const removeImage = asyncHandler(async (req, res) => {
  if (!req.body.publicId) throw new ApiError(400, 'publicId is required');
  await deleteImage(req.body.publicId);
  res.json({ success: true });
});
