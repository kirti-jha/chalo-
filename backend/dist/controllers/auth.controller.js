import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { withoutPassword } from '../utils/serializers';
const riderRegisterSchema = z.object({
    name: z.string().trim().min(2),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8),
    phone: z.string().trim().min(10),
    licenseNumber: z.string().trim().min(4).optional(),
});
const driverRegisterSchema = z.object({
    name: z.string().trim().min(2),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8),
    phone: z.string().trim().min(10),
    vehicleNumber: z.string().trim().min(4),
    licenseNumber: z.string().trim().min(4),
});
const adminRegisterSchema = z.object({
    name: z.string().trim().min(2),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8),
});
const loginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1),
});
export const registerRider = async (req, res) => {
    try {
        const { name, email, password, phone, licenseNumber } = riderRegisterSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, phone, licenseNumber },
        });
        const token = jwt.sign({ id: user.id, role: 'RIDER' }, process.env.JWT_SECRET || 'secret');
        res.status(201).json({ user: withoutPassword(user), token });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const loginRider = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, role: 'RIDER' }, process.env.JWT_SECRET || 'secret');
        res.json({ user: withoutPassword(user), token });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const registerDriver = async (req, res) => {
    try {
        const { name, email, password, phone, vehicleNumber, licenseNumber } = driverRegisterSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password, 10);
        const driver = await prisma.driver.create({
            data: { name, email, password: hashedPassword, phone, vehicleNumber, licenseNumber },
        });
        const token = jwt.sign({ id: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET || 'secret');
        res.status(201).json({ driver: withoutPassword(driver), token });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const loginDriver = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const driver = await prisma.driver.findUnique({ where: { email } });
        if (!driver || !(await bcrypt.compare(password, driver.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET || 'secret');
        res.json({ driver: withoutPassword(driver), token });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
        const token = jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret');
        res.json({ admin: withoutPassword(admin), token });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = adminRegisterSchema.parse(req.body);
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await prisma.admin.create({
            data: { name, email, password: hashedPassword },
        });
        const token = jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret');
        res.status(201).json({ admin: withoutPassword(admin), token });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
