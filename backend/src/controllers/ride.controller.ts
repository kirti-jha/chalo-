import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import prisma from '../config/prisma.js';
import socketService from '../services/socket.service.js';
import { FareService } from '../services/fare.service.js';

const createRideSchema = z.object({
  pickupLocation: z.string().trim().min(3),
  dropLocation: z.string().trim().min(3),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropLat: z.number(),
  dropLng: z.number(),
});

const acceptRideSchema = z.object({
  rideId: z.string().uuid(),
});

const updateRideStatusSchema = z.object({
  rideId: z.string().uuid(),
  status: z.enum(['ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
});

const cancelRideSchema = z.object({
  rideId: z.string().uuid(),
  reason: z.string().trim().min(3).max(200),
});

const sosSchema = z.object({
  rideId: z.string().uuid(),
  message: z.string().trim().min(5).max(300),
});

const rateDriverSchema = z.object({
  rideId: z.string().uuid(),
  rating: z.number().min(1).max(5),
});

export const createRide = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'RIDER') {
    return res.status(403).json({ message: 'Only riders can create rides' });
  }

  const riderId = req.user.id;

  try {
    const { pickupLocation, dropLocation, pickupLat, pickupLng, dropLat, dropLng } = createRideSchema.parse(req.body);
    const fare = FareService.calculateFare(pickupLat, pickupLng, dropLat, dropLng);

    const ride = await prisma.ride.create({
      data: {
        riderId,
        pickupLocation,
        dropLocation,
        pickupLat,
        pickupLng,
        dropLat,
        dropLng,
        fare,
        status: 'SEARCHING',
      },
    });

    // Find all online drivers for testing (ignoring radius and verification for now)
    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        isVerified: true,
      },
    });

    // Emit request to all nearby drivers
    drivers.forEach((driver: any) => {
      socketService.emitToDriver(driver.id, 'newRideRequest', ride);
    });

    res.status(201).json(ride);
  } catch (error: any) {
    console.error('Error in createRide:', error);
    res.status(500).json({ message: error.message });
  }
};

export const acceptRide = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Only drivers can accept rides' });
  }

  const driverId = req.user.id;

  try {
    const { rideId } = acceptRideSchema.parse(req.body);
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver?.isVerified || !driver.isOnline) {
      return res.status(403).json({ message: 'Driver must be verified and online to accept rides' });
    }

    const updatedCount = await prisma.ride.updateMany({
      where: { id: rideId, status: 'SEARCHING', driverId: null },
      data: {
        driverId,
        status: 'ACCEPTED',
      },
    });

    if (updatedCount.count === 0) {
      return res.status(400).json({ message: 'Ride no longer available' });
    }

    const updatedRide = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });

    if (!updatedRide) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Notify Rider
    socketService.emitToUser(updatedRide.riderId, 'rideAccepted', updatedRide);

    res.json(updatedRide);
  } catch (error: any) {
    console.error('Error in acceptRide:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateRideStatus = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Only drivers can update ride status' });
  }

  try {
    const { rideId, status } = updateRideStatusSchema.parse(req.body);
    console.log(`Attempting status update for ride ${rideId} to ${status}`);
    
    // 1. Verify ride exists first
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) {
      console.error(`Ride ${rideId} not found in database`);
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driverId !== req.user.id) {
      return res.status(403).json({ message: 'You are not assigned to this ride' });
    }

    const allowedTransitions: Record<string, string[]> = {
      ACCEPTED: ['ONGOING', 'CANCELLED'],
      ONGOING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      SEARCHING: ['ACCEPTED', 'CANCELLED'],
    };

    if (!allowedTransitions[ride.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot move ride from ${ride.status} to ${status}` });
    }

    // 2. Perform update
    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { status },
    });

    // 3. Handle stats and wallet update on completion
    if (status === 'COMPLETED' && updatedRide.driverId && ride.status !== 'COMPLETED') {
      try {
        const config = await prisma.appConfig.findFirst();
        const commissionRate = config?.commission ?? 0.2;
        const commission = updatedRide.fare * commissionRate;
        const netEarning = updatedRide.fare - commission;

        await prisma.ride.update({
          where: { id: rideId },
          data: { commission, netEarning },
        });

        const driver = await prisma.driver.update({
          where: { id: updatedRide.driverId },
          data: { 
            totalRides: { increment: 1 },
            walletBalance: { increment: netEarning }
          },
        });
        console.log(`SUCCESS: Driver ${driver.name} wallet updated. New balance: ${driver.walletBalance}`);
      } catch (driverError) {
        console.error(`ERROR updating driver wallet:`, driverError);
      }
    }

    // 4. Notify Rider via Socket
    socketService.emitToUser(updatedRide.riderId, 'rideStatusUpdate', updatedRide);
    console.log(`Ride ${rideId} updated to ${status} and rider notified`);

    res.json(updatedRide);
  } catch (error: any) {
    console.error('CRITICAL ERROR in updateRideStatus:', error);
    res.status(500).json({ message: error.message });
  }
};

export const cancelRide = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { rideId, reason } = cancelRideSchema.parse(req.body);
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isRider = req.user.role === 'RIDER' && ride.riderId === req.user.id;
    const isAssignedDriver = req.user.role === 'DRIVER' && ride.driverId === req.user.id;

    if (!isRider && !isAssignedDriver) {
      return res.status(403).json({ message: 'You cannot cancel this ride' });
    }

    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
      return res.status(400).json({ message: `Ride is already ${ride.status.toLowerCase()}` });
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'CANCELLED',
        cancelledBy: req.user.role,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: { driver: true, rider: true },
    });

    socketService.emitToRideParticipants(updatedRide.riderId, updatedRide.driverId, 'rideCancelled', updatedRide);

    res.json(updatedRide);
  } catch (error: any) {
    console.error('Error in cancelRide:', error);
    res.status(500).json({ message: error.message });
  }
};

export const raiseSos = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { rideId, message } = sosSchema.parse(req.body);
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true, driver: true },
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    const isParticipant = ride.riderId === req.user.id || ride.driverId === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not part of this ride' });
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: {
        emergencyRaised: true,
        emergencyMessage: message,
      },
      include: { rider: true, driver: true },
    });

    const reporterName = req.user.role === 'RIDER'
      ? updatedRide.rider.name
      : updatedRide.driver?.name ?? 'Driver';

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: req.user.id,
        userName: reporterName,
        userRole: req.user.role,
        rideId,
        ticketType: 'EMERGENCY',
        priority: 'CRITICAL',
        subject: 'Emergency SOS triggered',
        message,
      },
    });

    socketService.emitToRideParticipants(
      updatedRide.riderId,
      updatedRide.driverId,
      'sosRaised',
      { ride: updatedRide, ticket }
    );
    socketService.broadcast('adminEmergencyAlert', { ride: updatedRide, ticket });

    res.status(201).json({ ride: updatedRide, ticket });
  } catch (error: any) {
    console.error('Error in raiseSos:', error);
    res.status(500).json({ message: error.message });
  }
};

export const rateDriver = async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'RIDER') {
    return res.status(403).json({ message: 'Only riders can submit ratings' });
  }

  try {
    const { rideId, rating } = rateDriverSchema.parse(req.body);
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });

    if (!ride || !ride.driverId || ride.status !== 'COMPLETED' || ride.riderId !== req.user.id) {
      return res.status(400).json({ message: 'Invalid ride or driver' });
    }

    const driver = ride.driver;
    if (!driver) {
      return res.status(400).json({ message: 'Driver not found for ride' });
    }

    const newRating = (driver.rating * driver.totalRides + rating) / (driver.totalRides + 1);

    await prisma.driver.update({
      where: { id: ride.driverId },
      data: { rating: newRating },
    });

    res.json({ message: 'Rating submitted successfully', newRating });
  } catch (error: any) {
    console.error('Error in rateDriver:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getRideHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = req.user.id;
  const role = req.user.role;

  try {
    const rides = await prisma.ride.findMany({
      where: role === 'RIDER' ? { riderId: userId } : { driverId: userId },
      orderBy: { createdAt: 'desc' },
      include: role === 'RIDER' ? { driver: true } : { rider: true },
    });
    res.json(rides);
  } catch (error: any) {
    console.error('Error in getRideHistory:', error);
    res.status(500).json({ message: error.message });
  }
};

