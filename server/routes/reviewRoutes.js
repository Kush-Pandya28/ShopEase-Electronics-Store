import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import {
  getProductReviews,
  getEligibility,
  createReview,
  updateReview,
  deleteReview,
  toggleHelpful,
  getMyReviews,
  getAllReviews,
} from '../controllers/reviewController.js';

const router = Router();

const reviewRules = (optional = false) => [
  (optional ? body('rating').optional() : body('rating')).isInt({ min: 1, max: 5 }).withMessage('Rating must be 1 to 5'),
  body('title').optional().trim().isLength({ max: 100 }),
  body('comment').optional().trim().isLength({ max: 2000 }).withMessage('Comment is too long'),
  body('images').optional().isArray({ max: 4 }).withMessage('Up to 4 images allowed'),
  body('images.*').isURL({ require_tld: false, protocols: ['http', 'https'] }).withMessage('Invalid image'),
];

router.get('/me', protect, getMyReviews);
router.get('/admin/all', protect, admin, getAllReviews);
router.delete('/admin/:id', protect, admin, [param('id').isMongoId()], validate, deleteReview);

router.get('/product/:productId', getProductReviews);
router.get('/product/:productId/eligibility', protect, [param('productId').isMongoId()], validate, getEligibility);
router.post('/product/:productId', protect, [param('productId').isMongoId(), ...reviewRules()], validate, createReview);

router
  .route('/:id')
  .put(protect, [param('id').isMongoId(), ...reviewRules(true)], validate, updateReview)
  .delete(protect, [param('id').isMongoId()], validate, deleteReview);
router.post('/:id/helpful', protect, [param('id').isMongoId()], validate, toggleHelpful);

export default router;
