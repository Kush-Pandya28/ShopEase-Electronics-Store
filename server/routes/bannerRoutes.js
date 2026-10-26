import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/catalogController.js';

const router = Router();

router.get('/', getBanners);
router.post(
  '/',
  protect,
  admin,
  [body('title').trim().notEmpty().withMessage('Title is required'), body('image').trim().notEmpty().withMessage('Image is required')],
  validate,
  createBanner
);
router
  .route('/:id')
  .put(protect, admin, [param('id').isMongoId()], validate, updateBanner)
  .delete(protect, admin, [param('id').isMongoId()], validate, deleteBanner);

export default router;
