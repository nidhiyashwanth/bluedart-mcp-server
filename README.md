# bluedart-mcp-server

Model Context Protocol (MCP) server for the **BlueDart (DHL eCommerce India)** shipping API.

Exposes BlueDart's APIGEE endpoints — waybill creation, cancellation, pickup scheduling, transit-time lookup, tracking, and master downloads — as MCP tools that can be used by Claude Desktop, Claude Code, ChatGPT, and other standard MCP clients.

## Tools

| Tool | Method | What it does |
|---|---|---|
| `bluedart_generate_waybill` | write | Create a single AWB (POST /waybill/v1/GenerateWayBill) |
| `bluedart_import_waybill` | write | Bulk-create AWBs (POST /waybill/v1/ImportData) |
| `bluedart_cancel_waybill` | write | Cancel an AWB before in-scan |
| `bluedart_register_pickup` | write | Schedule a pickup |
| `bluedart_cancel_pickup` | write | Cancel a registered pickup |
| `bluedart_get_transit_time` | read | Estimate delivery date between two pincodes |
| `bluedart_track_shipment` | read | Track a shipment by AWB (markdown or json) |
| `bluedart_download_pincode_master` | read | Download serviceable pincode master |

All tools return both a text and a `structuredContent` payload, with BlueDart's error fields (`Status[].StatusInformation`, `IsError`, etc.) surfaced into a normalised `error` field.

## Setup

```bash
npm install
cp .env.example .env       # fill in your BlueDart APIGEE credentials
npm run build
```

### Environment variables

| Var | Required | Description |
|---|---|---|
| `BLUEDART_BASE_URL` | yes | `https://apigateway-sandbox.bluedart.com/in/transportation` (sandbox) or `https://apigateway.bluedart.com/in/transportation` (prod) |
| `BLUEDART_CLIENT_ID` | yes | OAuth Consumer Key from your APIGEE app |
| `BLUEDART_CLIENT_SECRET` | yes | OAuth Consumer Secret |
| `BLUEDART_LOGIN_ID` | yes | Profile LoginID (used in BlueDart payload) |
| `BLUEDART_LICENSE_KEY` | yes | Profile LicenceKey |
| `BLUEDART_API_TYPE` | no | `S` (sandbox) or as documented (default: `S`) |
| `BLUEDART_DEBUG` | no | `true` for verbose stderr logging |

JWT tokens are fetched once from `/token/v1/login` and cached in memory; the server auto-refreshes when the token is within 30 seconds of expiry, and will retry once on a 401/403.

## Client configuration

### Claude Desktop / Claude Code

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "bluedart": {
      "command": "node",
      "args": ["/absolute/path/to/bluedart-mcp-server/dist/index.js"],
      "env": {
        "BLUEDART_BASE_URL": "https://apigateway-sandbox.bluedart.com/in/transportation",
        "BLUEDART_CLIENT_ID": "...",
        "BLUEDART_CLIENT_SECRET": "...",
        "BLUEDART_LOGIN_ID": "...",
        "BLUEDART_LICENSE_KEY": "...",
        "BLUEDART_API_TYPE": "S"
      }
    }
  }
}
```

### ChatGPT

Configure as a stdio MCP server with the same `node dist/index.js` command and environment variables.

## Notes & caveats

- **OriginArea must match the shipper pincode region.** A mismatch returns `InvalidAreaScNotInRegion`. Example: `OriginArea='DEL'` with pincode `110030`.
- **CreditReferenceNo must be unique per shipment.** Reuse triggers `Waybill already generated`.
- Weight is in **kilograms**; dimensions in **centimetres**.
- The label PDF (`AWBPrintContent`) is base64-encoded and can be very large — set `PDFOutputNotRequired: true` in `Services` if you don't need it.
- This server only does API I/O. Custom label rendering (e.g. with logos/barcodes) is intentionally out of scope — do that in your application layer.

## Development

```bash
npm run dev      # tsx watch mode
npm run build    # compile to dist/
npm start        # run built server (stdio)
```

## License

MIT
