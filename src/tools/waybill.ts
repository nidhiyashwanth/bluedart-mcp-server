import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  CancelWaybillInputSchema,
  GenerateWaybillInputSchema,
  ImportWaybillInputSchema,
  SingleWaybillRequest,
} from "../schemas/waybill.js";
import { toBluedartDate } from "../schemas/common.js";
import { BluedartClient } from "../services/client.js";
import { BluedartConfig } from "../services/config.js";
import { runCall } from "./helpers.js";

function normalizeWaybill(req: SingleWaybillRequest): SingleWaybillRequest {
  const services = {
    ...req.Services,
    PickupDate: toBluedartDate(req.Services.PickupDate),
    PickupTime: req.Services.PickupTime.replace(":", ""),
    itemdtl: (req.Services.itemdtl || []).map((it) => ({
      ...it,
      InvoiceDate: it.InvoiceDate ? toBluedartDate(it.InvoiceDate) : undefined,
    })),
  };
  return { ...req, Services: services };
}

export function registerWaybillTools(server: McpServer, cfg: BluedartConfig) {
  server.registerTool(
    "bluedart_generate_waybill",
    {
      title: "Generate BlueDart Waybill",
      description:
        "Create a single BlueDart Air Waybill (AWB) for a shipment. " +
        "Calls POST /waybill/v1/GenerateWayBill. Returns the AWB number, routing info, and (unless suppressed) a base64 AWB label PDF in AWBPrintContent. " +
        "PRECONDITIONS: OriginArea must match the shipper pincode region (e.g. OriginArea='DEL' for pin '110030') or BlueDart returns InvalidAreaScNotInRegion. " +
        "CreditReferenceNo must be unique per shipment or BlueDart rejects with 'Waybill already generated'. " +
        "Weight is in kilograms, dimensions in centimetres.",
      inputSchema: GenerateWaybillInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      try {
        const normalized = normalizeWaybill(params as SingleWaybillRequest);
        return await runCall(
          () => BluedartClient.generateWaybill(cfg, normalized),
          "Common fixes: verify OriginArea matches shipper pincode region; ensure CreditReferenceNo is unique; check weight is in kg and dimensions in cm."
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error: ${msg}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "bluedart_import_waybill",
    {
      title: "Bulk Import BlueDart Waybills",
      description:
        "Create multiple BlueDart waybills in a single request via POST /waybill/v1/ImportData. " +
        "Each entry has the same shape as bluedart_generate_waybill. Returns per-shipment results; partial successes are possible.",
      inputSchema: ImportWaybillInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ shipments }) => {
      try {
        const normalized = (shipments as SingleWaybillRequest[]).map(normalizeWaybill);
        return await runCall(() => BluedartClient.importWaybill(cfg, normalized));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error: ${msg}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "bluedart_cancel_waybill",
    {
      title: "Cancel BlueDart Waybill",
      description:
        "Cancel a BlueDart waybill by AWB number via POST /waybill/v1/CancelWaybill. " +
        "Only works before the shipment has been manifest-scanned (in-scanned). After in-scan, cancellation is rejected by BlueDart.",
      inputSchema: CancelWaybillInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ awb_no }) => {
      return await runCall(() => BluedartClient.cancelWaybill(cfg, awb_no));
    }
  );
}

// Force z to be retained as a value import for tsc when --isolatedModules is on
void z;
