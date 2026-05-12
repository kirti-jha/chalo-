import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import prisma from '../config/prisma.js';
import { getDistance } from '../utils/geo.js';

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
      activeRides.forEach((ride: any) => {
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

export const getNearbyDrivers = async (req: AuthRequest, res: Response) => {
  const { lat, lng, radius = 5 } = req.query; // radius in km

  try {
    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        isVerified: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        name: true,
        currentLat: true,
        currentLng: true,
        vehicleNumber: true,
      },
    });

    const nearbyDrivers = drivers.filter(driver => {
      if (!driver.currentLat || !driver.currentLng || !lat || !lng) return false;
      const distance = getDistance(Number(lat), Number(lng), driver.currentLat, driver.currentLng);
      return distance <= Number(radius);
    });

    res.json(nearbyDrivers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

