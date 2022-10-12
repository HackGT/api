import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // const hackathon = await prisma.hackathon.upsert({
  //   where: {
  //     id: 1,
  //   },
  //   update: {},
  //   create: {
  //     name: "HackGT 8",
  //   },
  // });

  // console.log("HACKATHON");
  // console.log(hackathon);

  const config = await prisma.config.upsert({
    where: {
      id: 1,
    },
    update: {},
    create: {},
  });

  console.log("CONFIG");
  console.log(config);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
