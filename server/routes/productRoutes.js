import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import {
  getProducts,
  getFilterOptions,
  getSuggestions,
  getFeatured,
  getNewArrivals,
  getDeals,
  getProductBySlug,
  getRelated,
  compareProducts,
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

const router = Router();

const productRules = (optional = false) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
    f('brand').isMongoId().withMessage('Select a brand'),
    f('category').isMongoId().withMessage('Select a category'),
    f('variants').isArray({ min: 1 }).withMessage('Add at least one variant'),
    body('variants.*.sku').optional().trim().notEmpty().withMessage('Variant SKU is required'),
    body('variants.*.price').optional().isFloat({ min: 0 }).withMessage('Variant price must be a positive number'),
    body('variants.*.mrp').optional().isFloat({ min: 0 }).withMessage('Variant MRP must be a positive number'),
    body('variants.*.stock').optional().isInt({ min: 0 }).withMessage('Variant stock must be 0 or more'),
    body('images').optional().isArray({ max: 10 }),
    body('specifications').optional().isArray(),
    body('highlights').optional().isArray(),
  ];
};

// Public
router.get('/', getProducts);
router.get('/filters', getFilterOptions);
router.get('/suggest', getSuggestions);
router.get('/featured', getFeatured);
router.get('/new', getNewArrivals);
router.get('/deals', getDeals);
router.post('/compare', [body('ids').isArray({ min: 2, max: 4 }).withMessage('Select 2 to 4 products')], validate, compareProducts);

// Admin
router.get('/admin/all', protect, admin, getAdminProducts);
router.get('/admin/:id', protect, admin, [param('id').isMongoId()], validate, getProductById);
router.post('/', protect, admin, productRules(), validate, createProduct);
router
  .route('/:id')
  .put(protect, admin, [param('id').isMongoId(), ...productRules(true)], validate, updateProduct)
  .delete(protect, admin, [param('id').isMongoId()], validate, deleteProduct);

router.get('/:id/related', [param('id').isMongoId()], validate, getRelated);
router.get('/:slug', getProductBySlug);

export default router;
