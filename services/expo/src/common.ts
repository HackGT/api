/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import { PrismaClient, User as PrismaUser } from "@prisma/client";
import path from "path";
import fs from "fs";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import config from "@api/config";

// eslint-disable-next-line import/no-mutable-exports
export let prizeConfig: any;

try {
  prizeConfig = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./config/prizeConfig.json"), "utf8")
  );
} catch (err: any) {
  if (err.code !== "ENOENT") {
    throw err;
  }
}

export const prisma = new PrismaClient({
  errorFormat: "pretty",
  datasources: {
    db: {
      url: `${config.database.postgres.uri}/${config.services.EXPO.database?.name ?? ""}`,
    },
  },
});
