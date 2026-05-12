import prisma from './config/prisma.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.create({
    data: {
      name: 'Super Admin',
      email: 'admin@chalo.com',
      password: hashedPassword
    }
  });
  console.log('Admin created successfully:');
  console.log('Email: admin@chalo.com');
  console.log('Password: admin123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
