import { DatabaseConfig, GatewayConfig, Service, ServiceConfig } from "./types";

export const GATEWAY: GatewayConfig = {
  port: parseInt(process.env.PORT || "8080"),
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    uri: String(process.env.MONGO_URI),
  },
  redis: {
    uri: String(process.env.REDIS_URI),
  },
};

export const SERVICES: Record<Service, ServiceConfig> = {
  USERS: {
    url: "/users",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    proxy: {
      target: "https://users.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/users`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "users",
    },
  },
  EVENTS: {
    url: "/events",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
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
  INTERACTIONS: {
    url: "/interactions",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    proxy: {
      target: "https://interactions.api.hexlabs.org",
      changeOrigin: true,
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
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    proxy: {
      target: "https://notifications.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/notifications`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "notifications",
    },
  },
  FILES: {
    url: "/files",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    proxy: {
      target: "https://files.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/files`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "files",
    },
    storageBucket: "hexlabs-api-files",
  },
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
