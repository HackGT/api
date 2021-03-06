export interface CommonConfig {
  production: boolean;
  socialMedia: {
    twitterHandle: string;
    facebookHandle: string;
  };
  memberEmailDomains: string[];
  apiKey?: string;
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
}

export enum Service {
  USERS = "USERS",
  HEXATHONS = "HEXATHONS",
  CHECKIN = "CHECKIN",
  REGISTRATION = "REGISTRATION",
  NOTIFICATIONS = "NOTIFICATIONS",
  FILES = "FILES",
  AUTH = "AUTH",
}

export interface ServiceConfig {
  url: string;
  port: number;
  auth: boolean;
  proxy: {
    target: string;
    changeOrigin: boolean;
    pathRewrite: Record<string, string>;
  };
  database?: {
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
      from?: string;
      headerImage?: string;
    };
  };
  storageBucket?: string;
}

export interface Config {
  common: CommonConfig;
  gateway: GatewayConfig;
  docs: DocsConfig;
  database: DatabaseConfig;
  services: Record<Service, ServiceConfig>;
}
