import axios, { AxiosResponse } from "axios";
import { ENDPOINTS } from "../constants.js";
import { BluedartConfig, buildProfile, logDebug } from "./config.js";
import { clearTokenCache, getAccessToken } from "./auth.js";

async function authedRequest(
  cfg: BluedartConfig,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>
): Promise<AxiosResponse> {
  const token = await getAccessToken(cfg);
  const url = cfg.baseUrl + path;
  const params = query
    ? Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined)
      )
    : undefined;

  logDebug(cfg, `${method} ${path}`, { hasBody: Boolean(body), params });

  const resp = await axios.request({
    method,
    url,
    data: body,
    params,
    headers: {
      JWTToken: token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    validateStatus: () => true,
  });

  if (resp.status === 401 || resp.status === 403) {
    logDebug(cfg, "auth failed; clearing cache and retrying once");
    clearTokenCache();
    const retryToken = await getAccessToken(cfg);
    return await axios.request({
      method,
      url,
      data: body,
      params,
      headers: {
        JWTToken: retryToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      validateStatus: () => true,
    });
  }

  return resp;
}

export interface BluedartCallResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  errorMessage?: string;
}

function extractErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;

  const status = d.Status as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(status) && status.length > 0) {
    const info = status[0]?.StatusInformation;
    if (typeof info === "string" && info.trim()) return info;
  }

  for (const key of [
    "StatusInformation",
    "ErrorMessage",
    "ErrorDescription",
    "Message",
    "fault",
  ]) {
    const v = d[key];
    if (typeof v === "string" && v.trim()) return v;
    if (v && typeof v === "object") return JSON.stringify(v);
  }

  if (d.IsError === true || d.IsError === "true") {
    return "BlueDart returned IsError=true (no message)";
  }
  return undefined;
}

async function call<T = unknown>(
  cfg: BluedartConfig,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>
): Promise<BluedartCallResult<T>> {
  const resp = await authedRequest(cfg, method, path, body, query);
  const errorMessage = extractErrorMessage(resp.data);
  const ok = resp.status < 400 && !errorMessage;
  return {
    ok,
    status: resp.status,
    data: resp.data as T,
    errorMessage,
  };
}

function withProfile(cfg: BluedartConfig, request: unknown) {
  return {
    Request: request,
    Profile: buildProfile(cfg),
  };
}

export const BluedartClient = {
  generateWaybill(cfg: BluedartConfig, request: unknown) {
    return call(cfg, "POST", ENDPOINTS.generateWaybill, withProfile(cfg, request));
  },
  importWaybill(cfg: BluedartConfig, requests: unknown[]) {
    return call(cfg, "POST", ENDPOINTS.importWaybill, withProfile(cfg, requests));
  },
  cancelWaybill(cfg: BluedartConfig, awbNo: string) {
    return call(cfg, "POST", ENDPOINTS.cancelWaybill, withProfile(cfg, { AWBNo: awbNo }));
  },
  registerPickup(cfg: BluedartConfig, request: unknown) {
    return call(cfg, "POST", ENDPOINTS.registerPickup, withProfile(cfg, request));
  },
  cancelPickup(cfg: BluedartConfig, tokenNumber: string, shipmentDate: string) {
    return call(
      cfg,
      "POST",
      ENDPOINTS.cancelPickup,
      withProfile(cfg, {
        TokenNumber: tokenNumber,
        ShipmentPickupDate: shipmentDate,
      })
    );
  },
  getTransitTime(cfg: BluedartConfig, payload: Record<string, unknown>) {
    return call(cfg, "POST", ENDPOINTS.transitTime, {
      ...payload,
      profile: buildProfile(cfg),
    });
  },
  downloadPincodeMaster(cfg: BluedartConfig, lastSyncDate: string) {
    return call(cfg, "POST", ENDPOINTS.pincodeMaster, {
      lastSynchDate: lastSyncDate,
      profile: buildProfile(cfg),
    });
  },
  trackShipment(
    cfg: BluedartConfig,
    awbNumber: string,
    options: { scan?: boolean; format?: string } = {}
  ) {
    return call(cfg, "GET", ENDPOINTS.tracking, undefined, {
      handler: "tnt",
      action: "custawbquery",
      loginid: cfg.loginId,
      lickey: cfg.licenseKey,
      awb: "awb",
      numbers: awbNumber,
      verno: "1",
      scan: options.scan === false ? "0" : "1",
      format: options.format || "json",
    });
  },
};
