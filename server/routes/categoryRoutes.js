import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { categoryCrud } from '../controllers/catalogController.js';

const router = Router();

router.get('/', categoryCrud.list);
router.get('/:slug', categoryCrud.getBySlug);
router.post(
  '/',
  protect,
  admin,
  [body('name').trim().notEmpty().withMessage('Name is required'), body('parent').optional({ values: 'falsy' }).isMongoId()],
  validate,
  categoryCrud.create
);
router
  .route('/:id')
  .put(protect, admin, [param('id').isMongoId(), body('parent').optional({ values: 'null' }).isMongoId()], validate, categoryCrud.update)
  .delete(protect, admin, [param('id').isMongoId()], validate, categoryCrud.remove);

export default router;
