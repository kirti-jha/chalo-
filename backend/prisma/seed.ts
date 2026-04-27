import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Rider
  await prisma.user.upsert({
    where: { email: 'rider@test.com' },
    update: {},
    create: {
      name: 'Test Rider',
      email: 'rider@test.com',
      password: hashedPassword,
      phone: '1234567890',
    },
  });

  // Create Driver
  await prisma.driver.upsert({
    where: { email: 'driver@test.com' },
    update: {},
    create: {
      name: 'Test Driver',
      email: 'driver@test.com',
      password: hashedPassword,
      phone: '0987654321',
      vehicleNumber: 'DL 01 AB 1234',
      isOnline: false,
    },
  });

  console.log('Seed data created!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
