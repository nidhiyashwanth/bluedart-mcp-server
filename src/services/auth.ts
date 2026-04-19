import axios from "axios";
import jwt from "jsonwebtoken";
import { ENDPOINTS } from "../constants.js";
import { BluedartConfig, logDebug } from "./config.js";

interface CachedToken {
  token: string;
  exp: number;
}

let cached: CachedToken | null = null;

function isStillValid(entry: CachedToken | null): boolean {
  if (!entry) return false;
  const now = Math.floor(Date.now() / 1000);
  return entry.exp - now > 30;
}

function decodeExp(token: string): number {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  return decoded?.exp ?? 0;
}

export async function getAccessToken(cfg: BluedartConfig): Promise<string> {
  if (isStillValid(cached)) {
    logDebug(cfg, "reusing cached JWT");
    return cached!.token;
  }

  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error(
      "BlueDart credentials missing: set BLUEDART_CLIENT_ID and BLUEDART_CLIENT_SECRET"
    );
  }

  logDebug(cfg, "fetching new JWT", { url: cfg.baseUrl + ENDPOINTS.login });

  const resp = await axios.get(cfg.baseUrl + ENDPOINTS.login, {
    headers: {
      ClientID: cfg.clientId,
      clientSecret: cfg.clientSecret,
      Accept: "application/json",
    },
    validateStatus: () => true,
  });

  if (resp.status >= 400) {
    throw new Error(
      `BlueDart auth failed (HTTP ${resp.status}): ${
        typeof resp.data === "string" ? resp.data : JSON.stringify(resp.data)
      }`
    );
  }

  const token: string =
    (typeof resp.data === "string" ? resp.data : resp.data?.JWTToken) || "";

  if (!token) {
    throw new Error(
      `BlueDart auth response did not include JWTToken: ${JSON.stringify(
        resp.data
      )}`
    );
  }

  cached = { token, exp: decodeExp(token) };
  logDebug(cfg, "JWT cached", {
    expiresAt: new Date(cached.exp * 1000).toISOString(),
  });
  return token;
}

export function clearTokenCache(): void {
  cached = null;
}
