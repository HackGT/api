export const GATEWAY = {
  port: 8000,
};

export const SERVICES = {
  AUTH: {
    url: "/auth",
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
        [`^/auth`]: "",
      },
    },
    database: {
      type: "mongo",
      host: "localhost",
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
