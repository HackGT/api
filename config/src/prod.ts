import { DatabaseConfig, DocsConfig, GatewayConfig, Service, ServiceConfig } from "./types";

export const GATEWAY: GatewayConfig = {
  port: parseInt(process.env.PORT || "8080"),
};

export const DOCS: DocsConfig = {
  port: parseInt(process.env.PORT || "8080"),
};

export const DATABASE: DatabaseConfig = {
  mongo: {
    uri: String(process.env.MONGO_URI),
  },
  redis: {
    uri: String(process.env.REDIS_URI),
  },
  postgres: {
    uri: String(process.env.POSTGRES_URI),
  },
};

export const SERVICES: Record<Service, ServiceConfig> = {
  USERS: {
    url: "/users",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://71f8be78aa014d7eabff05facd5c1e05@o429043.ingest.sentry.io/4503972457873408",
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
  HEXATHONS: {
    url: "/hexathons",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://7639463db49047a99459d4a8c3b9d31a@o429043.ingest.sentry.io/4503972527669248",
    proxy: {
      target: "https://hexathons.api.hexlabs.org",
      changeOrigin: true,
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
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://5b7c041f29f74379a66dde9f2a127294@o429043.ingest.sentry.io/4503972530683904",
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
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://c438c0bcc08246639ac6485410e2bd81@o429043.ingest.sentry.io/4503972532387840",
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
  FILES: {
    url: "/files",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://ba81ee07ea9c405bb446a04a67e40db5@o429043.ingest.sentry.io/4503972533501952",
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
  },
  AUTH: {
    url: "/auth",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://dfb8b601b19144c1af6ea9aa7075f73c@o429043.ingest.sentry.io/4503972534419456",
    proxy: {
      target: "https://auth.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/auth`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "auth",
    },
  },
  HARDWARE: {
    url: "/hardware",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    proxy: {
      target: "https://hardware.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/hardware`]: "",
      },
    },
    database: {
      type: "mongo",
      name: "hardware",
    },
  },
  EXPO: {
    url: "/expo",
    port: parseInt(process.env.PORT || "8080"),
    auth: false,
    sentryDSN: "https://ee2a8e3295ad44939d44f1b4f38a1528@o429043.ingest.sentry.io/4504029245407232",
    proxy: {
      target: "https://expo.api.hexlabs.org",
      changeOrigin: true,
      pathRewrite: {
        [`^/expo`]: "",
      },
    },
    database: {
      type: "postgres",
      name: "expo",
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
