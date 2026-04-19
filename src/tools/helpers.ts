import { BluedartCallResult } from "../services/client.js";

export interface ToolResult {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export function jsonResult(
  result: BluedartCallResult,
  extraStructured: Record<string, unknown> = {}
): ToolResult {
  const structured = {
    ok: result.ok,
    status: result.status,
    error: result.errorMessage,
    data: result.data,
    ...extraStructured,
  };
  return {
    content: [{ type: "text", text: JSON.stringify(structured, null, 2) }],
    structuredContent: structured,
    isError: !result.ok,
  };
}

export function errorResult(message: string): ToolResult {
  const structured = { ok: false, error: message };
  return {
    content: [{ type: "text", text: `Error: ${message}` }],
    structuredContent: structured,
    isError: true,
  };
}

export async function runCall(
  fn: () => Promise<BluedartCallResult>,
  hint?: string
): Promise<ToolResult> {
  try {
    const result = await fn();
    if (!result.ok && hint && result.errorMessage) {
      // Append actionable hint to the structured error.
      return jsonResult(result, { hint });
    }
    return jsonResult(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return errorResult(msg);
  }
}
