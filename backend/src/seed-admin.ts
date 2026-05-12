import prisma from './config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  const email = 'admin@chalo.com';
  const password = 'password123'; // Default testing password
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      name: 'Super Admin',
      email,
      password: hashedPassword,
    },
  });

  console.log('Admin seeded successfully:', admin.email);
  console.log('Password set to:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

