import express from 'express';
import { createTicket, getAllTickets, resolveTicket } from '../controllers/support.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
const router = express.Router();
router.post('/create', authenticate, createTicket);
router.get('/all', authenticate, authorizeRoles('ADMIN'), getAllTickets);
router.patch('/resolve', authenticate, authorizeRoles('ADMIN'), resolveTicket);
export default router;
