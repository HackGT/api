import {
  DatabaseConfig,
  GatewayConfig,
  GeneralConfig,
  Service,
  ServiceConfig,
} from "./types";

export const GATEWAY: GatewayConfig = {
  port: 8000,
  firebase: {
    projectId: String(process.env.FIREBASE_PROJECT_ID),
    clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n"), // replace `\` and `n` character pairs w/ single `\n` character
  },
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    baseUri: "mongodb://localhost/",
  },
};

export const SERVICES: Record<Service, ServiceConfig> = {
  PROFILES: {
    url: "/profiles",
    port: 8001,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "http://localhost:8001",
      changeOrigin: false,
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
    port: 8002,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "http://localhost:8002",
      changeOrigin: false,
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
    port: 8003,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "http://localhost:8003",
      changeOrigin: false,
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
    port: 8004,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "http://localhost:8004",
      changeOrigin: false,
      pathRewrite: {
        [`^/registration`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "registration",
    },
  },
  INTERACTIONS: {
    url: "/interactions",
    port: 8005,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "http://localhost:8005",
      changeOrigin: false,
      pathRewrite: {
        [`^/interactions`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "interactions",
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
