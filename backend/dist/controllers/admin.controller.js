import { z } from 'zod';
import prisma from '../config/prisma.js';
const verifyDriverSchema = z.object({
    driverId: z.string().uuid(),
    isVerified: z.boolean(),
});
export const getDashboardStats = async (req, res) => {
    try {
        const totalRides = await prisma.ride.count({ where: { status: 'COMPLETED' } });
        const activeEmergencies = await prisma.supportTicket.count({
            where: { ticketType: 'EMERGENCY', status: 'OPEN' },
        });
        const stats = await prisma.ride.aggregate({
            where: { status: 'COMPLETED' },
            _sum: {
                fare: true,
                commission: true,
                netEarning: true,
            },
        });
        const recentRides = await prisma.ride.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { rider: true, driver: true },
        });
        res.json({
            totalRides,
            totalRevenue: stats._sum.fare || 0,
            totalCommission: stats._sum.commission || 0,
            totalDriverEarnings: stats._sum.netEarning || 0,
            activeEmergencies,
            recentRides,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllDrivers = async (req, res) => {
    try {
        const drivers = await prisma.driver.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(drivers);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const verifyDriver = async (req, res) => {
    try {
        const { driverId, isVerified } = verifyDriverSchema.parse(req.body);
        const driver = await prisma.driver.update({
            where: { id: driverId },
            data: { isVerified }
        });
        res.json(driver);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
