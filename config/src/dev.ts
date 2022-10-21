import { DatabaseConfig, GatewayConfig, DocsConfig, Service, ServiceConfig } from "./types";

export const GATEWAY: GatewayConfig = {
  port: 8000,
};

export const DOCS: DocsConfig = {
  port: 4000,
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    uri: "mongodb://localhost",
  },
  redis: {
    uri: "redis://localhost",
  },
  postgres: {
    uri: "postgres://postgres@localhost",
  },
};

export const SERVICES: Record<Service, ServiceConfig> = {
  USERS: {
    url: "/users",
    port: 8001,
    auth: false,
    proxy: {
      target: "http://localhost:8001",
      changeOrigin: false,
      pathRewrite: {
        [`^/users`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "users",
    },
  },
  HEXATHONS: {
    url: "/hexathons",
    port: 8002,
    auth: false,
    proxy: {
      target: "http://localhost:8002",
      changeOrigin: false,
      pathRewrite: {
        [`^/hexathons`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "hexathons",
    },
  },
  NOTIFICATIONS: {
    url: "/notifications",
    port: 8003,
    auth: false,
    proxy: {
      target: "http://localhost:8003",
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
        accountSID: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        serviceSID: process.env.TWILIO_SERVICE_SID,
      },
      email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY,
      },
    },
  },
  REGISTRATION: {
    url: "/registration",
    port: 8004,
    auth: false,
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
  FILES: {
    url: "/files",
    port: 8005,
    auth: false,
    proxy: {
      target: "http://localhost:8005",
      changeOrigin: false,
      pathRewrite: {
        [`^/files`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "files",
    },
  },
  AUTH: {
    url: "/auth",
    port: 8006,
    auth: false,
    proxy: {
      target: "http://localhost:8006",
      changeOrigin: false,
      pathRewrite: {
        [`^/auth`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "auth",
    },
  },
  EXPO: {
    url: "/expo",
    port: 8007,
    auth: false,
    proxy: {
      target: "http://localhost:8007",
      changeOrigin: false,
      pathRewrite: {
        [`^/expo`]: "",
      },
    },
    database: {
      type: "postgres",
      name: "expo",
    },
  },
  HARDWARE: {
    url: "/hardware",
    port: 8008,
    auth: false,
    proxy: {
      target: "http://localhost:8008",
      changeOrigin: false,
      pathRewrite: {
        [`^/hardware`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "hardware",
    },
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
