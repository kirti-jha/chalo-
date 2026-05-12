import { Router } from 'express';
import { getDashboardStats, getAllDrivers, verifyDriver } from '../controllers/admin.controller.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/drivers', getAllDrivers);
router.patch('/verify-driver', verifyDriver);

export default router;

