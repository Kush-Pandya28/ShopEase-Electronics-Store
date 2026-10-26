import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { uploadImages, uploadReviewImages, removeImage } from '../controllers/uploadController.js';

const router = Router();

// Customers can attach up to 4 photos to a review
router.post('/review', protect, upload.array('images', 4), uploadReviewImages);

router.use(protect, admin);
router.post('/', upload.array('images', 8), uploadImages);
router.delete('/', removeImage);

export default router;
