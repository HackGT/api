/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import { PrismaClient, User as PrismaUser } from "@prisma/client";
import config from "@api/config";

export const prisma = new PrismaClient({
  errorFormat: "pretty",
  datasources: {
    db: {
      url: `${config.database.postgres.uri}/${config.services.EXPO.database?.name ?? ""}`,
    },
  },
});
