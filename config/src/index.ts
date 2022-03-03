/* eslint-disable import/first */
import dotenv from "dotenv";
import admin from "firebase-admin";
import path from "path";

// env vars need to be loaded before other imports
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import * as devConfig from "./dev";
import * as prodConfig from "./prod";
import { CommonConfig, Config } from "./types";

// eslint-disable-next-line import/no-mutable-exports
let config: Config;

export const COMMON: CommonConfig = {
  production: process.env.PRODUCTION === "true",
  socialMedia: {
    twitterHandle: "thehexlabs",
    facebookHandle: "TheHexLabs",
  },
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
      projectId: String(process.env.GOOGLE_PROJECT_ID),
      clientEmail: String(process.env.GOOGLE_CLIENT_EMAIL),
      privateKey: String(process.env.GOOGLE_PRIVATE_KEY).replace(/\\n/g, "\n"), // replace `\` and `n` character pairs w/ single `\n` character,
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
