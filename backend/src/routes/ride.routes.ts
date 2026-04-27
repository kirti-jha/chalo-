import { Router } from 'express';
import { createRide, acceptRide, updateRideStatus, cancelRide, raiseSos, getRideHistory, rateDriver } from '../controllers/ride.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/request', createRide);
router.post('/accept', acceptRide);
router.patch('/status', updateRideStatus);
router.post('/cancel', cancelRide);
router.post('/sos', raiseSos);
router.post('/rate-driver', rateDriver);
router.get('/history', getRideHistory);

export default router;

