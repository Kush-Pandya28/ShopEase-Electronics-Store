import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { ORDER_STATUSES } from '../models/Order.js';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  getInvoice,
  getAllOrders,
  updateOrderStatus,
  resolveReturn,
} from '../controllers/orderController.js';

const router = Router();
const idRule = [param('id').isMongoId().withMessage('Invalid order id')];

router.use(protect);

router
  .route('/')
  .post([body('addressId').isMongoId().withMessage('Select a delivery address')], validate, createOrder)
  .get(admin, getAllOrders);
router.get('/my', getMyOrders);
router.get('/:id', idRule, validate, getOrderById);
router.put('/:id/cancel', idRule, validate, cancelOrder);
router.post(
  '/:id/return',
  [
    ...idRule,
    body('reason').trim().isLength({ min: 10, max: 500 }).withMessage('Please describe the issue (at least 10 characters)'),
    body('type').optional().isIn(['return', 'replace']),
  ],
  validate,
  requestReturn
);
router.get('/:id/invoice', idRule, validate, getInvoice);

// Admin
router.put(
  '/:id/status',
  admin,
  [...idRule, body('status').optional().isIn(ORDER_STATUSES).withMessage('Invalid status')],
  validate,
  updateOrderStatus
);
router.put(
  '/:id/return',
  admin,
  [...idRule, body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject')],
  validate,
  resolveReturn
);

export default router;
