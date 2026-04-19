import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TrackShipmentInputSchema } from "../schemas/tracking.js";
import { BluedartClient } from "../services/client.js";
import { BluedartConfig } from "../services/config.js";
import { jsonResult, errorResult } from "./helpers.js";

function summariseTracking(awb: string, data: unknown): string {
  const lines = [`# BlueDart Tracking — ${awb}`, ""];
  if (!data || typeof data !== "object") {
    lines.push("(no structured tracking data)");
    return lines.join("\n");
  }
  const d = data as Record<string, any>;
  const shipment =
    d.ShipmentData?.Shipment?.[0] ||
    d.Shipment?.[0] ||
    d.shipment ||
    d;
  const status = shipment?.Status || shipment?.CurrentStatus || shipment?.status;
  if (status) lines.push(`**Status**: ${typeof status === "string" ? status : JSON.stringify(status)}`);
  const expected =
    shipment?.ExpectedDelivery || shipment?.ExpectedDeliveryDate;
  if (expected) lines.push(`**Expected delivery**: ${expected}`);
  const scans = shipment?.Scans || shipment?.scans || [];
  if (Array.isArray(scans) && scans.length) {
    lines.push("", "## Scans");
    for (const s of scans) {
      const t = s?.ScanDate || s?.Date || s?.date || "";
      const desc = s?.Scan || s?.Description || s?.Status || "";
      const loc = s?.ScannedLocation || s?.Location || "";
      lines.push(`- ${t} — ${desc}${loc ? ` (${loc})` : ""}`);
    }
  }
  return lines.join("\n");
}

export function registerTrackingTools(server: McpServer, cfg: BluedartConfig) {
  server.registerTool(
    "bluedart_track_shipment",
    {
      title: "Track BlueDart Shipment",
      description:
        "Track a BlueDart shipment by AWB number. Read-only. " +
        "Returns the current status, expected delivery date, and (when include_scans=true) the scan history. " +
        "Set response_format='markdown' for a human-readable summary or 'json' for the raw payload.",
      inputSchema: TrackShipmentInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ awb_number, include_scans, response_format }) => {
      try {
        const result = await BluedartClient.trackShipment(cfg, awb_number, {
          scan: include_scans,
        });
        if (response_format === "markdown") {
          const text = result.ok
            ? summariseTracking(awb_number, result.data)
            : `Error tracking ${awb_number}: ${result.errorMessage || `HTTP ${result.status}`}`;
          return {
            content: [{ type: "text", text }],
            structuredContent: {
              ok: result.ok,
              status: result.status,
              error: result.errorMessage,
              data: result.data,
            },
            isError: !result.ok,
          };
        }
        return jsonResult(result);
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
