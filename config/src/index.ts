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

const COMMON: CommonConfig = {
  production: process.env.PRODUCTION === "true",
  socialMedia: {
    twitterHandle: "thehexlabs",
    facebookHandle: "TheHexLabs",
  },
  memberEmailDomains: ["hack.gt", "hexlabs.org"],
  apiKey: process.env.API_KEY,
};

// Initialize firebase admin with credentials
admin.initializeApp();

if (COMMON.production) {
  config = {
    common: COMMON,
    gateway: prodConfig.GATEWAY,
    database: prodConfig.DATABASE,
    services: prodConfig.SERVICES,
  };
} else {
  config = {
    common: COMMON,
    gateway: devConfig.GATEWAY,
    database: devConfig.DATABASE,
    services: devConfig.SERVICES,
  };
}

export default config;

export * from "./types";
