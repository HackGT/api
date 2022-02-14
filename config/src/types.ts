export interface GatewayConfig {
  port: number;
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
}

export interface DatabaseConfig {
  mongo: {
    baseUri: string;
  };
}

export enum Service {
  PROFILES = "PROFILES",
  EVENTS = "EVENTS",
  CHECKIN = "CHECKIN",
  REGISTRATION = "REGISTRATION",
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
}

export interface GeneralConfig {
  production: boolean;
}

export interface Config {
  gateway: GatewayConfig;
  database: DatabaseConfig;
  services: Record<Service, ServiceConfig>;
  general: GeneralConfig;
}
