import { Router } from 'express';
import { toggleOnlineStatus, getProfile, getNearbyDrivers } from '../controllers/driver.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.patch('/toggle-online', toggleOnlineStatus);
router.get('/profile', getProfile);
router.get('/nearby', getNearbyDrivers);

export default router;

