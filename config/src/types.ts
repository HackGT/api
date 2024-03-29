export interface CommonConfig {
  production: boolean;
  socialMedia: {
    website: string;
    instagramHandle: string;
    twitterHandle: string;
    facebookHandle: string;
  };
  emailAddress: string;
  emailFrom: string;
  googleCloud: {
    project: string;
    location: string;
    serviceAccount: string;
    oAuthClientId?: string;
    taskQueue: string;
    storageBuckets: {
      default: string;
      publicCDN: string;
      finance: string;
    };
  };
  memberEmailDomains: string[];
}

export interface GatewayConfig {
  port: number;
}

export interface DocsConfig {
  port: number;
}

export interface DatabaseConfig {
  mongo: {
    uri: string;
  };
  redis: {
    uri: string;
  };
  postgres: {
    uri: string;
  };
}

export enum Service {
  USERS = "USERS",
  HEXATHONS = "HEXATHONS",
  NOTIFICATIONS = "NOTIFICATIONS",
  REGISTRATION = "REGISTRATION",
  FILES = "FILES",
  AUTH = "AUTH",
  EXPO = "EXPO",
  HARDWARE = "HARDWARE",
  FINANCE = "FINANCE",
}

export interface ServiceConfig {
  url: string;
  port: number;
  auth: boolean;
  sentryDSN?: string;
  proxy: {
    target: string;
    changeOrigin: boolean;
    pathRewrite: Record<string, string>;
  };
  database: {
    type: string;
    name: string;
  };
  pluginConfig?: {
    twilio: {
      accountSID?: string;
      authToken?: string;
      serviceSID?: string;
    };
    email: {
      sendgridApiKey?: string;
    };
  };
}

export interface Config {
  common: CommonConfig;
  gateway: GatewayConfig;
  docs: DocsConfig;
  database: DatabaseConfig;
  services: Record<Service, ServiceConfig>;
}
