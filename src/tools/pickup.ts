import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CancelPickupInputSchema,
  RegisterPickupInputSchema,
} from "../schemas/pickup.js";
import { BluedartClient } from "../services/client.js";
import { BluedartConfig } from "../services/config.js";
import { runCall } from "./helpers.js";

export function registerPickupTools(server: McpServer, cfg: BluedartConfig) {
  server.registerTool(
    "bluedart_register_pickup",
    {
      title: "Register BlueDart Pickup",
      description:
        "Schedule a BlueDart pickup at the customer location via POST /pickup/v1/RegisterPickup. " +
        "Returns a TokenNumber that is required to cancel the pickup later. " +
        "AreaCode must match the pickup pincode region (same constraint as waybill OriginArea).",
      inputSchema: RegisterPickupInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      return await runCall(() => BluedartClient.registerPickup(cfg, params));
    }
  );

  server.registerTool(
    "bluedart_cancel_pickup",
    {
      title: "Cancel BlueDart Pickup",
      description:
        "Cancel a previously registered pickup via POST /cancel-pickup/v1/CancelPickup. " +
        "Requires the TokenNumber returned by bluedart_register_pickup and the original ShipmentPickupDate.",
      inputSchema: CancelPickupInputSchema,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ token_number, shipment_pickup_date }) => {
      return await runCall(() =>
        BluedartClient.cancelPickup(cfg, token_number, shipment_pickup_date)
      );
    }
  );
}
