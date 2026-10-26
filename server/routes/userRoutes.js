import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { normalizePhone } from '../utils/helpers.js';
import {
  getMe,
  updateMe,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getUsers,
  updateUser,
  logoutAll,
} from '../controllers/userController.js';

const router = Router();

const addressRules = (optional = false) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('fullName').trim().notEmpty().withMessage('Full name is required'),
    f('phone').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10 digit mobile number'),
    f('street').trim().notEmpty().withMessage('Street address is required'),
    f('city').trim().notEmpty().withMessage('City is required'),
    f('state').trim().notEmpty().withMessage('State is required'),
    f('pincode').trim().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
    body('isDefault').optional().isBoolean(),
  ];
};

router.use(protect);

router.route('/me').get(getMe).put(
  [
    body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('phone')
      .optional({ values: 'falsy' })
      .customSanitizer(normalizePhone)
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Enter a valid 10 digit mobile number'),
  ],
  validate,
  updateMe
);
router.put(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/[A-Za-z]/)
      .withMessage('Password must contain a letter')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
  ],
  validate,
  changePassword
);
router.post('/me/logout-all', logoutAll);

router.post('/me/addresses', addressRules(), validate, addAddress);
router
  .route('/me/addresses/:addressId')
  .put([param('addressId').isMongoId(), ...addressRules(true)], validate, updateAddress)
  .delete([param('addressId').isMongoId()], validate, deleteAddress);

router
  .route('/me/wishlist')
  .get(getWishlist)
  .post([body('productId').isMongoId().withMessage('Invalid product')], validate, addToWishlist);
router.delete('/me/wishlist/:productId', [param('productId').isMongoId()], validate, removeFromWishlist);

// Admin
router.get('/', admin, getUsers);
router.put(
  '/:id',
  admin,
  [
    param('id').isMongoId(),
    body('role').optional().isIn(['customer', 'admin']).withMessage('Invalid role'),
    body('isBlocked').optional().isBoolean(),
  ],
  validate,
  updateUser
);

export default router;
