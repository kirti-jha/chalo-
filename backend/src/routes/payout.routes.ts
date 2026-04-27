import express from 'express';
import { requestPayout, getAllPayoutRequests, approvePayout } from '../controllers/payout.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/request', authenticate, authorizeRoles('DRIVER'), requestPayout);
router.get('/all', authenticate, authorizeRoles('ADMIN'), getAllPayoutRequests);
router.patch('/approve', authenticate, authorizeRoles('ADMIN'), approvePayout);

export default router;

