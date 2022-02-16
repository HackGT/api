import {
  DatabaseConfig,
  GatewayConfig,
  GeneralConfig,
  Service,
  ServiceConfig,
} from "./types";

export const GATEWAY: GatewayConfig = {
  port: 3000,
  firebase: {
    projectId: String(process.env.FIREBASE_PROJECT_ID),
    clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n"), // replace `\` and `n` character pairs w/ single `\n` character
  },
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    baseUri: String(process.env.MONGO_BASE_URI),
  },
};

export const SERVICES: Record<Service, ServiceConfig> = {
  PROFILES: {
    url: "/profiles",
    port: 8080,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "https://profiles.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/profiles`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "profiles",
    },
  },
  EVENTS: {
    url: "/events",
    port: 8080,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "https://events.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/events`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "events",
    },
  },
  CHECKIN: {
    url: "/checkin",
    port: 8080,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "https://checkin.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/checkin`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "checkin",
    },
  },
  REGISTRATION: {
    url: "/registration",
    port: 8080,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "https://registration.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/registration`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "registration",
    },
  },
};

export const GENERAL: GeneralConfig = {
  production: false,
};

// const SERVICES = [
//   {
//     url: "/free",
//     auth: false,
//     creditCheck: false,
//     rateLimit: {
//       windowMs: 15 * 60 * 1000,
//       max: 5,
//     },
//     proxy: {
//       target: "https://www.google.com",
//       changeOrigin: true,
//       pathRewrite: {
//         [`^/free`]: "",
//       },
//     },
//   },
//   {
//     url: "/premium",
//     auth: true,
//     creditCheck: true,
//     proxy: {
//       target: "https://www.google.com",
//       changeOrigin: true,
//       pathRewrite: {
//         [`^/premium`]: "",
//       },
//     },
//   },
// ];
