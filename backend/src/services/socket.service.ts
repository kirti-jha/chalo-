import { Server, Socket } from 'socket.io';
import prisma from '../config/prisma.js';

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private driverSockets: Map<string, string> = new Map(); // driverId -> socketId

  init(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('User connected:', socket.id);

      socket.on('join', async (data: { userId: string; role: 'RIDER' | 'DRIVER' }) => {
        if (data.role === 'RIDER') {
          this.userSockets.set(data.userId, socket.id);
        } else {
          this.driverSockets.set(data.userId, socket.id);
          // Update driver's socketId in DB
          await prisma.driver.update({
            where: { id: data.userId },
            data: { socketId: socket.id },
          });
        }
        console.log(`${data.role} joined: ${data.userId}`);
      });

      socket.on('updateLocation', async (data: { driverId: string; lat: number; lng: number }) => {
        // Update driver location in DB
        await prisma.driver.update({
          where: { id: data.driverId },
          data: { currentLat: data.lat, currentLng: data.lng },
        });

        // Find active ride for this driver to notify rider
        const activeRide = await prisma.ride.findFirst({
          where: {
            driverId: data.driverId,
            status: { in: ['ACCEPTED', 'ONGOING'] }
          },
          select: { riderId: true }
        });

        if (activeRide) {
          this.emitToUser(activeRide.riderId, 'driverLocationUpdate', {
            lat: data.lat,
            lng: data.lng
          });
        }

        console.log(`Driver ${data.driverId} location updated: ${data.lat}, ${data.lng}`);
      });

      socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        
        // Find if it was a driver and update status
        for (const [driverId, sid] of this.driverSockets.entries()) {
          if (sid === socket.id) {
            this.driverSockets.delete(driverId);
            await prisma.driver.update({
              where: { id: driverId },
              data: { isOnline: false, socketId: null },
            });
            console.log(`Driver ${driverId} set to offline due to disconnect`);
            break;
          }
        }

        // Clean up rider sockets
        for (const [userId, sid] of this.userSockets.entries()) {
          if (sid === socket.id) {
            this.userSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  emitToDriver(driverId: string, event: string, data: any) {
    const socketId = this.driverSockets.get(driverId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToRideParticipants(riderId: string, driverId: string | null | undefined, event: string, data: any) {
    this.emitToUser(riderId, event, data);
    if (driverId) {
      this.emitToDriver(driverId, event, data);
    }
  }

  broadcast(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export default new SocketService();

