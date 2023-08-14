import config from "@api/config";

import { PrismaClient } from "@api/prisma-teams/generated";

export const prisma = new PrismaClient({
  errorFormat: "pretty",
  datasources: {
    db: {
      url: `${config.database.postgres.uri}/${config.services.TEAMS.database.name}`,
    },
  },
});
