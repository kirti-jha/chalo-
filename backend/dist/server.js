import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import socketService from './services/socket.service';
import authRoutes from './routes/auth.routes';
import rideRoutes from './routes/ride.routes';
import driverRoutes from './routes/driver.routes';
import adminRoutes from './routes/admin.routes';
import supportRoutes from './routes/support.routes';
import payoutRoutes from './routes/payout.routes';
import profileRoutes from './routes/profile.routes';
dotenv.config();
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
// Initialize Socket.IO
socketService.init(server);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/profile', profileRoutes);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
export default app;
