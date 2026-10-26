import { Router } from 'express';
import { protect, admin } from '../middleware/auth.js';
import { getStats, getSalesReport, getEmails, sendTestEmail, getPublicLink } from '../controllers/adminController.js';

const router = Router();

router.use(protect, admin);
router.get('/stats', getStats);
router.get('/sales-report', getSalesReport);
router.get('/emails', getEmails);
router.post('/emails/test', sendTestEmail);
router.get('/public-link', getPublicLink);

export default router;
