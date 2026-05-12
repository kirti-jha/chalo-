import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';
import { withoutPassword } from '../utils/serializers';
const DEMO_PASSWORD_HASH = '$2b$10$Jxv6U8fkKcM9M9nM1A2rMeczN0nzzakDx4zY/boYYGr2susx6bwyK';
const toDemoKey = (value) => value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'demo-user';
const buildDemoIdentity = (value) => {
    const rawValue = value.trim();
    const key = toDemoKey(rawValue);
    return {
        rawValue,
        key,
        email: rawValue.includes('@') ? rawValue.toLowerCase() : `${key}@demo.chalo.local`,
        name: rawValue || 'Demo User',
    };
};
const getErrorMessage = (error) => error instanceof Error ? error.message : 'Unexpected server error';
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
    email: z.string().trim().min(1),
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
        res.status(400).json({ message: getErrorMessage(error) });
    }
};
export const loginRider = async (req, res) => {
    try {
        const { email } = loginSchema.parse(req.body);
        const identity = buildDemoIdentity(email);
        let user = await prisma.user.findUnique({ where: { email: identity.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: identity.name,
                    email: identity.email,
                    password: DEMO_PASSWORD_HASH,
                    phone: `demo-rider-${identity.key}`.slice(0, 40),
                    licenseNumber: `DEMO-${identity.key}`.slice(0, 40),
                    isVerified: true,
                },
            });
        }
        const token = jwt.sign({ id: user.id, role: 'RIDER' }, process.env.JWT_SECRET || 'secret');
        res.json({ user: withoutPassword(user), token });
    }
    catch (error) {
        res.status(500).json({ message: getErrorMessage(error) });
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
        res.status(400).json({ message: getErrorMessage(error) });
    }
};
export const loginDriver = async (req, res) => {
    try {
        const { email } = loginSchema.parse(req.body);
        const identity = buildDemoIdentity(email);
        let driver = await prisma.driver.findUnique({ where: { email: identity.email } });
        if (!driver) {
            driver = await prisma.driver.create({
                data: {
                    name: identity.name,
                    email: identity.email,
                    password: DEMO_PASSWORD_HASH,
                    phone: `demo-driver-${identity.key}`.slice(0, 40),
                    vehicleNumber: `DEMO-${identity.key}`.slice(0, 40),
                    licenseNumber: `DL-${identity.key}`.slice(0, 40),
                    isVerified: true,
                },
            });
        }
        const token = jwt.sign({ id: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET || 'secret');
        res.json({ driver: withoutPassword(driver), token });
    }
    catch (error) {
        res.status(500).json({ message: getErrorMessage(error) });
    }
};
export const loginAdmin = async (req, res) => {
    try {
        const { email } = loginSchema.parse(req.body);
        const identity = buildDemoIdentity(email);
        let admin = await prisma.admin.findUnique({ where: { email: identity.email } });
        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    name: identity.name,
                    email: identity.email,
                    password: DEMO_PASSWORD_HASH,
                },
            });
        }
        const token = jwt.sign({ id: admin.id, role: 'ADMIN' }, process.env.JWT_SECRET || 'secret');
        res.json({ admin: withoutPassword(admin), token });
    }
    catch (error) {
        res.status(500).json({ message: getErrorMessage(error) });
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
        res.status(400).json({ message: getErrorMessage(error) });
    }
};
