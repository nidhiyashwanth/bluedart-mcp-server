import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TransitTimeInputSchema } from "../schemas/transit.js";
import { toBluedartDate } from "../schemas/common.js";
import { BluedartClient } from "../services/client.js";
import { BluedartConfig } from "../services/config.js";
import { runCall } from "./helpers.js";

export function registerTransitTools(server: McpServer, cfg: BluedartConfig) {
  server.registerTool(
    "bluedart_get_transit_time",
    {
      title: "Get BlueDart Domestic Transit Time",
      description:
        "Estimate the expected delivery date for a shipment between two Indian pincodes via " +
        "POST /transit/v1/GetDomesticTransitTimeForPinCodeandProduct. " +
        "Read-only; safe to call repeatedly.",
      inputSchema: TransitTimeInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({
      origin_pincode,
      destination_pincode,
      product_code,
      sub_product_code,
      pickup_date,
      pickup_time,
    }) => {
      const payload = {
        pPinCode: origin_pincode,
        pPinCodeTo: destination_pincode,
        pProductCode: product_code,
        pSubProductCode: sub_product_code,
        pPudate: toBluedartDate(pickup_date || new Date().toISOString()),
        pPickupTime: pickup_time,
      };
      return await runCall(() => BluedartClient.getTransitTime(cfg, payload));
    }
  );
}
