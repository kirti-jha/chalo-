import { Router } from 'express';
import { toggleOnlineStatus, getProfile } from '../controllers/driver.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.patch('/toggle-online', toggleOnlineStatus);
router.get('/profile', getProfile);

export default router;

