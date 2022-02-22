import { DatabaseConfig, GatewayConfig, GeneralConfig, Service, ServiceConfig } from "./types";

export const GATEWAY: GatewayConfig = {
  port: 8000,
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    uri: "mongodb://localhost/${DATABASE}", // eslint-disable-line no-template-curly-in-string
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
  NOTIFICATIONS: {
    url: "/notifications",
    port: 8006,
    auth: false,
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 5,
    },
    proxy: {
      target: "http://localhost:8006",
      changeOrigin: false,
      pathRewrite: {
        [`^/notifications`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "notifications",
    },
    pluginConfig: {
      twilio: {
        accountSID: String(process.env.TWILIO_ACCOUNT_SID),
        authToken: String(process.env.TWILIO_AUTH_TOKEN),
        serviceSID: String(process.env.TWILIO_SERVICE_SID),
        senderNumber: String(process.env.TWILIO_SENDER_NUMBER),
      },
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
