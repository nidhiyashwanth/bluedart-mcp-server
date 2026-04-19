import { DEFAULT_BASE_URL } from "../constants.js";

export interface BluedartConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  loginId: string;
  licenseKey: string;
  apiType: string;
  debug: boolean;
}

export function loadConfig(): BluedartConfig {
  const baseUrl = (process.env.BLUEDART_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/+$/,
    ""
  );

  return {
    baseUrl,
    clientId: process.env.BLUEDART_CLIENT_ID || "",
    clientSecret: process.env.BLUEDART_CLIENT_SECRET || "",
    loginId: process.env.BLUEDART_LOGIN_ID || "",
    licenseKey: process.env.BLUEDART_LICENSE_KEY || "",
    apiType: process.env.BLUEDART_API_TYPE || "S",
    debug: (process.env.BLUEDART_DEBUG || "").toLowerCase() === "true",
  };
}

export function buildProfile(cfg: BluedartConfig) {
  return {
    LoginID: cfg.loginId,
    LicenceKey: cfg.licenseKey,
    Api_type: cfg.apiType,
  };
}

export function logDebug(cfg: BluedartConfig, ...args: unknown[]): void {
  if (cfg.debug) {
    console.error("[bluedart-mcp]", ...args);
  }
}
