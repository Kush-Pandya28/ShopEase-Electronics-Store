import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
  applyCoupon,
} from '../controllers/cartController.js';

const router = Router();

router.use(protect);

router.route('/').get(getCart).delete(clearCart);
router.post(
  '/items',
  [
    body('productId').isMongoId().withMessage('Invalid product'),
    body('variantSku').trim().notEmpty().withMessage('Select a variant'),
    body('quantity').optional().isInt({ min: 1, max: 10 }).withMessage('Quantity must be between 1 and 10'),
  ],
  validate,
  addItem
);
router
  .route('/items/:itemId')
  .put([param('itemId').isMongoId(), body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')], validate, updateItem)
  .delete([param('itemId').isMongoId()], validate, removeItem);
router.post('/merge', [body('items').isArray()], validate, mergeCart);
router.post('/coupon', [body('code').trim().notEmpty().withMessage('Enter a coupon code')], validate, applyCoupon);

export default router;
