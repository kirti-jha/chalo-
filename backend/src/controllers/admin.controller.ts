import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

const verifyDriverSchema = z.object({
  driverId: z.string().uuid(),
  isVerified: z.boolean(),
});

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const getAllDrivers = async (req: AuthRequest, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyDriver = async (req: AuthRequest, res: Response) => {
  try {
    const { driverId, isVerified } = verifyDriverSchema.parse(req.body);
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { isVerified }
    });
    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

