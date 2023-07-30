import config from "@api/config";

import { PrismaClient } from "@api/prisma-hardware/generated";

export const prisma = new PrismaClient({
  errorFormat: "pretty",
  datasources: {
    db: {
      url: `${config.database.postgres.uri}/${config.services.HARDWARE.database?.name ?? ""}`,
    },
  },
});
