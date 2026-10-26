import { Router } from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { createPaymentOrder, verifyPayment, razorpayWebhook, getPaymentConfig } from '../controllers/paymentController.js';

const router = Router();

router.get('/config', getPaymentConfig);
router.post('/create-order', protect, [body('addressId').isMongoId().withMessage('Select a delivery address')], validate, createPaymentOrder);
router.post(
  '/verify',
  protect,
  [body('razorpay_order_id').notEmpty(), body('addressId').isMongoId().withMessage('Select a delivery address')],
  validate,
  verifyPayment
);
router.post('/webhook', razorpayWebhook);

export default router;
