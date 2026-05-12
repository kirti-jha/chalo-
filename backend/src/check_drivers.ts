import prisma from './config/prisma.js';

async function main() {
  const drivers = await prisma.driver.findMany();
  console.log(JSON.stringify(drivers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
