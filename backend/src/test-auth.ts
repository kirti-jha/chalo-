import prisma from './config/prisma.js';
import bcrypt from 'bcrypt';

async function test() {
  const email = 'admin@chalo.com';
  const password = 'password123';
  
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    console.log('Admin NOT FOUND');
    return;
  }
  
  const match = await bcrypt.compare(password, admin.password);
  console.log('Admin found:', admin.email);
  console.log('Password match:', match);
}

test().finally(() => prisma.$disconnect());

