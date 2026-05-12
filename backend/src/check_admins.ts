import prisma from './config/prisma.js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const admins = await prisma.admin.findMany();
  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
