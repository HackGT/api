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
  CHECKIN: {
    url: "/checkin",
    port: 8003,
    auth: false,
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
  NOTIFICATIONS: {
    url: "/notifications",
    port: 8006,
    auth: false,
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
        accountSID: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        serviceSID: process.env.TWILIO_SERVICE_SID,
      },
      email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY,
        from: process.env.EMAIL_FROM,
        headerImage: process.env.EMAIL_HEADER_IMAGE,
      },
    },
  },
  FILES: {
    url: "/files",
    port: 8007,
    auth: false,
    proxy: {
      target: "http://localhost:8007",
      changeOrigin: false,
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
  AUTH: {
    url: "/auth",
    port: 8008,
    auth: false,
    proxy: {
      target: "http://localhost:8008",
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
