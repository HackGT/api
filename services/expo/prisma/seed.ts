import { PrismaClient } from "./generated"; // eslint-disable-line import/no-relative-packages

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.config.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {},
  });

  console.log("Expo config seeded:");
  console.log(config);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async err => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
