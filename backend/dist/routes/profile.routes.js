import express from 'express';
import { getMyProfile, updateProfile } from '../controllers/profile.controller';
import { authenticate } from '../middlewares/auth.middleware';
const router = express.Router();
router.get('/me', authenticate, getMyProfile);
router.patch('/update', authenticate, updateProfile);
export default router;
