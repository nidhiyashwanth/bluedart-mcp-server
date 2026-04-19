import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PincodeMasterInputSchema } from "../schemas/master.js";
import { toBluedartDate } from "../schemas/common.js";
import { BluedartClient } from "../services/client.js";
import { BluedartConfig } from "../services/config.js";
import { runCall, errorResult } from "./helpers.js";

export function registerMasterTools(server: McpServer, cfg: BluedartConfig) {
  server.registerTool(
    "bluedart_download_pincode_master",
    {
      title: "Download BlueDart Pincode Master",
      description:
        "Download serviceable pincode master data via POST /masterdownload/v1/DownloadPinCodeMaster. " +
        "Pass last_sync_date to get only changes since that date. The response can be very large; consider syncing incrementally.",
      inputSchema: PincodeMasterInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ last_sync_date }) => {
      try {
        const formatted = toBluedartDate(last_sync_date);
        return await runCall(() =>
          BluedartClient.downloadPincodeMaster(cfg, formatted)
        );
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );
}
