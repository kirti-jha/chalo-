import { Server } from 'socket.io';
import prisma from '../config/prisma';
class SocketService {
    io = null;
    userSockets = new Map(); // userId -> socketId
    driverSockets = new Map(); // driverId -> socketId
    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
            },
        });
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);
            socket.on('join', async (data) => {
                if (data.role === 'RIDER') {
                    this.userSockets.set(data.userId, socket.id);
                }
                else {
                    this.driverSockets.set(data.userId, socket.id);
                    // Update driver's socketId in DB
                    await prisma.driver.update({
                        where: { id: data.userId },
                        data: { socketId: socket.id },
                    });
                }
                console.log(`${data.role} joined: ${data.userId}`);
            });
            socket.on('updateLocation', async (data) => {
                // Update driver location in DB
                await prisma.driver.update({
                    where: { id: data.driverId },
                    data: {
                        currentLat: data.lat,
                        currentLng: data.lng,
                    },
                });
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
    emitToDriver(driverId, event, data) {
        const socketId = this.driverSockets.get(driverId);
        if (socketId && this.io) {
            this.io.to(socketId).emit(event, data);
        }
    }
    emitToUser(userId, event, data) {
        const socketId = this.userSockets.get(userId);
        if (socketId && this.io) {
            this.io.to(socketId).emit(event, data);
        }
    }
    emitToRideParticipants(riderId, driverId, event, data) {
        this.emitToUser(riderId, event, data);
        if (driverId) {
            this.emitToDriver(driverId, event, data);
        }
    }
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
}
export default new SocketService();
