import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import * as devConfig from "./dev";
import * as prodConfig from "./prod";
import { CommonConfig, Config } from "./types";

let config: Config;

const COMMON: CommonConfig = {
  production: process.env.PRODUCTION == "true",
};

if (COMMON.production) {
  admin.initializeApp();

  config = {
    common: COMMON,
    gateway: prodConfig.GATEWAY,
    database: prodConfig.DATABASE,
    services: prodConfig.SERVICES,
    general: prodConfig.GENERAL,
  };
} else {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: String(process.env.FIREBASE_PROJECT_ID),
      clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL),
      privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(
        /\\n/g,
        "\n"
      ), // replace `\` and `n` character pairs w/ single `\n` character,
    }),
  });

  config = {
    common: COMMON,
    gateway: devConfig.GATEWAY,
    database: devConfig.DATABASE,
    services: devConfig.SERVICES,
    general: devConfig.GENERAL,
  };
}

export default config;

export * from "./types";
