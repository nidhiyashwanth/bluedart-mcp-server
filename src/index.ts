#!/usr/bin/env node
import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SERVER_NAME, SERVER_VERSION } from "./constants.js";
import { loadConfig } from "./services/config.js";
import { registerWaybillTools } from "./tools/waybill.js";
import { registerPickupTools } from "./tools/pickup.js";
import { registerTransitTools } from "./tools/transit.js";
import { registerTrackingTools } from "./tools/tracking.js";
import { registerMasterTools } from "./tools/master.js";

dotenv.config();

async function main() {
  const cfg = loadConfig();

  const missing: string[] = [];
  if (!cfg.clientId) missing.push("BLUEDART_CLIENT_ID");
  if (!cfg.clientSecret) missing.push("BLUEDART_CLIENT_SECRET");
  if (!cfg.loginId) missing.push("BLUEDART_LOGIN_ID");
  if (!cfg.licenseKey) missing.push("BLUEDART_LICENSE_KEY");
  if (missing.length) {
    console.error(
      `[${SERVER_NAME}] WARNING: missing required env vars: ${missing.join(", ")}. ` +
        `Tool calls will fail until these are set.`
    );
  }

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerWaybillTools(server, cfg);
  registerPickupTools(server, cfg);
  registerTransitTools(server, cfg);
  registerTrackingTools(server, cfg);
  registerMasterTools(server, cfg);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${SERVER_NAME}] v${SERVER_VERSION} ready on stdio`);
}

main().catch((err) => {
  console.error(`[${SERVER_NAME}] fatal:`, err);
  process.exit(1);
});
