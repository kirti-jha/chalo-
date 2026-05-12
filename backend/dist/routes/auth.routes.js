import { Router } from 'express';
import { registerRider, loginRider, registerDriver, loginDriver, loginAdmin } from '../controllers/auth.controller.js';
const router = Router();
router.post('/rider/register', registerRider);
router.post('/rider/login', loginRider);
router.post('/driver/register', registerDriver);
router.post('/driver/login', loginDriver);
router.post('/admin/login', loginAdmin);
export default router;
