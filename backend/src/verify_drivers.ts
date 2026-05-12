import prisma from './config/prisma.js';

async function main() {
  const result = await prisma.driver.updateMany({
    data: { isVerified: true }
  });
  console.log(`Verified ${result.count} drivers.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
