import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import prisma from '../config/prisma.js';

import socketService from '../services/socket.service.js';

export const toggleOnlineStatus = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Only drivers can change online status' });
  }

  const { isOnline } = req.body;
  const driverId = req.user.id;

  try {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { isOnline },
    });

    if (isOnline) {
      // Find active rides and notify this driver specifically
      const activeRides = await prisma.ride.findMany({
        where: { status: 'SEARCHING' }
      });
      activeRides.forEach(ride => {
        socketService.emitToDriver(driverId, 'newRideRequest', ride);
      });
    }

    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Only drivers can access this profile' });
  }

  const driverId = req.user.id;
  try {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

