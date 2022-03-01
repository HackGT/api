export interface CommonConfig {
  production: boolean;
}

export interface GatewayConfig {
  port: number;
}

export interface DatabaseConfig {
  mongo: {
    uri: string;
  };
}

export enum Service {
  USERS = "USERS",
  EVENTS = "EVENTS",
  CHECKIN = "CHECKIN",
  REGISTRATION = "REGISTRATION",
  INTERACTIONS = "INTERACTIONS",
  NOTIFICATIONS = "NOTIFICATIONS",
  FILES = "FILES",
}

export interface ServiceConfig {
  url: string;
  port: number;
  auth: boolean;
  rateLimit: {
    windowMs: number;
    max: number;
  };
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
  };
}

export interface GeneralConfig {
  production: boolean;
}

export interface Config {
  common: CommonConfig;
  gateway: GatewayConfig;
  database: DatabaseConfig;
  services: Record<Service, ServiceConfig>;
  general: GeneralConfig;
}
