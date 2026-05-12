import prisma from '../config/prisma.js';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { withoutPassword } from '../utils/serializers.js';
const profileSchema = z.object({
    name: z.string().trim().min(2).optional(),
    phone: z.string().trim().min(10).optional(),
    upiId: z.string().trim().min(3).nullable().optional(),
    bankAccount: z.string().trim().min(6).nullable().optional(),
    emergencyContactName: z.string().trim().min(2).nullable().optional(),
    emergencyContactPhone: z.string().trim().min(10).nullable().optional(),
    password: z.string().min(8).optional(),
});
export const getMyProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const entity = req.user.role === 'RIDER'
            ? await prisma.user.findUnique({ where: { id: req.user.id } })
            : await prisma.driver.findUnique({ where: { id: req.user.id } });
        if (!entity) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.json({ user: withoutPassword(entity) });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const updateProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const userId = req.user.id;
    const role = req.user.role;
    try {
        const { name, phone, upiId, bankAccount, emergencyContactName, emergencyContactPhone, password, } = profileSchema.parse(req.body);
        const updateData = {
            name,
            phone,
            upiId,
            bankAccount,
            emergencyContactName,
            emergencyContactPhone,
        };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        let updatedUser;
        if (role === 'RIDER') {
            updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
        }
        else {
            updatedUser = await prisma.driver.update({
                where: { id: userId },
                data: updateData
            });
        }
        res.json({ message: 'Profile updated successfully', user: withoutPassword(updatedUser) });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};
