import { z } from 'zod';
import prisma from '../config/prisma';
const payoutSchema = z.object({
    amount: z.number().positive(),
});
const payoutDecisionSchema = z.object({
    payoutId: z.string().uuid(),
    status: z.enum(['APPROVED', 'REJECTED']),
});
export const requestPayout = async (req, res) => {
    if (req.user?.role !== 'DRIVER') {
        return res.status(403).json({ message: 'Only drivers can request payouts' });
    }
    const driverId = req.user.id;
    try {
        const { amount } = payoutSchema.parse(req.body);
        const driver = await prisma.driver.findUnique({ where: { id: driverId } });
        if (!driver || driver.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient wallet balance' });
        }
        if (!driver.upiId && !driver.bankAccount) {
            return res.status(400).json({ message: 'Please add payment details in settings first' });
        }
        const payout = await prisma.payoutRequest.create({
            data: {
                driverId,
                amount,
                upiId: driver.upiId || driver.bankAccount,
                status: 'PENDING'
            }
        });
        // Deduct from wallet immediately to prevent double withdrawal
        await prisma.driver.update({
            where: { id: driverId },
            data: { walletBalance: { decrement: amount } }
        });
        res.status(201).json(payout);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllPayoutRequests = async (req, res) => {
    try {
        const payouts = await prisma.payoutRequest.findMany({
            include: { driver: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payouts);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const approvePayout = async (req, res) => {
    try {
        const { payoutId, status } = payoutDecisionSchema.parse(req.body);
        const payout = await prisma.payoutRequest.findUnique({ where: { id: payoutId } });
        if (!payout || payout.status !== 'PENDING') {
            return res.status(400).json({ message: 'Invalid payout request' });
        }
        const updatedPayout = await prisma.payoutRequest.update({
            where: { id: payoutId },
            data: { status }
        });
        if (status === 'REJECTED') {
            // Refund to driver wallet
            await prisma.driver.update({
                where: { id: payout.driverId },
                data: { walletBalance: { increment: payout.amount } }
            });
        }
        res.json(updatedPayout);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
