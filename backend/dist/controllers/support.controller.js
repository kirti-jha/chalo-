import { z } from 'zod';
import prisma from '../config/prisma';
const ticketSchema = z.object({
    subject: z.string().trim().min(3),
    message: z.string().trim().min(10),
    rideId: z.string().uuid().optional(),
    ticketType: z.enum(['GENERAL', 'EMERGENCY']).optional(),
    priority: z.enum(['NORMAL', 'HIGH', 'CRITICAL']).optional(),
});
const resolveTicketSchema = z.object({
    ticketId: z.string().uuid(),
});
export const createTicket = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const userRole = req.user.role;
    try {
        const { subject, message, rideId, ticketType, priority } = ticketSchema.parse(req.body);
        // Get user name based on role
        let userName = "Unknown";
        if (userRole === 'RIDER') {
            const u = await prisma.user.findUnique({ where: { id: userId } });
            userName = u?.name || "Rider";
        }
        else {
            const d = await prisma.driver.findUnique({ where: { id: userId } });
            userName = d?.name || "Driver";
        }
        const ticket = await prisma.supportTicket.create({
            data: {
                userId,
                userName,
                userRole,
                rideId,
                ticketType: ticketType ?? 'GENERAL',
                priority: priority ?? 'NORMAL',
                subject,
                message,
            },
        });
        res.status(201).json(ticket);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const getAllTickets = async (req, res) => {
    try {
        const tickets = await prisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const resolveTicket = async (req, res) => {
    try {
        const { ticketId } = resolveTicketSchema.parse(req.body);
        const ticket = await prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: 'RESOLVED', resolvedAt: new Date() }
        });
        res.json(ticket);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
