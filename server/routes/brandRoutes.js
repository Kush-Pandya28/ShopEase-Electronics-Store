import { Router } from 'express';
import { body, param } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect, admin } from '../middleware/auth.js';
import { brandCrud } from '../controllers/catalogController.js';

const router = Router();

router.get('/', brandCrud.list);
router.get('/:slug', brandCrud.getBySlug);
router.post('/', protect, admin, [body('name').trim().notEmpty().withMessage('Name is required')], validate, brandCrud.create);
router
  .route('/:id')
  .put(protect, admin, [param('id').isMongoId()], validate, brandCrud.update)
  .delete(protect, admin, [param('id').isMongoId()], validate, brandCrud.remove);

export default router;
