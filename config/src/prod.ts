import {
  DatabaseConfig,
  GatewayConfig,
  GeneralConfig,
  Service,
  ServiceConfig,
} from "./types";

export const GATEWAY: GatewayConfig = {
  port: parseInt(process.env.PORT || "8080"),
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    uri: String(process.env.MONGO_URI),
    tlsCAFile: String(process.env.MONGO_TLS_CA_FILE),
  },
};

export const SERVICES: Record<Service, ServiceConfig> = {
  PROFILES: {
    url: "/profiles",
    port: parseInt(process.env.PORT || "8080"),
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
    port: parseInt(process.env.PORT || "8080"),
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
    port: parseInt(process.env.PORT || "8080"),
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
    port: parseInt(process.env.PORT || "8080"),
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
