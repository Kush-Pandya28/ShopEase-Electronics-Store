import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import {
  validateCoupon,
  getAvailableCoupons,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';

const router = Router();

const couponRules = (optional = false) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('code').trim().matches(/^[A-Za-z0-9_-]{3,20}$/).withMessage('Code must be 3-20 letters/numbers'),
    f('type').isIn(['percent', 'flat']).withMessage('Type must be percent or flat'),
    f('value').isFloat({ gt: 0 }).withMessage('Value must be greater than 0'),
    f('expiresAt').isISO8601().withMessage('Expiry date is required'),
    body('minOrderValue').optional().isFloat({ min: 0 }),
    body('maxDiscount').optional().isFloat({ min: 0 }),
    body('usageLimit').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ];
};

router.get('/available', getAvailableCoupons);
router.post('/validate', protect, [body('code').trim().notEmpty().withMessage('Enter a coupon code')], validate, validateCoupon);

router.use(protect, admin);
router.route('/').get(getCoupons).post(couponRules(), validate, createCoupon);
router
  .route('/:id')
  .put([param('id').isMongoId(), ...couponRules(true)], validate, updateCoupon)
  .delete([param('id').isMongoId()], validate, deleteCoupon);

export default router;
