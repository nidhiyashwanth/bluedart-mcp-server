import { z } from "zod";

export const ResponseFormatSchema = z
  .enum(["markdown", "json"])
  .default("json")
  .describe("Output format. 'json' returns the raw BlueDart payload, 'markdown' returns a human summary.");

export const PincodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Indian pincode must be 6 digits")
  .describe("6-digit Indian pincode");

export const PhoneSchema = z
  .string()
  .min(6)
  .max(15)
  .describe("Phone or mobile number (digits, 6-15 chars)");

/**
 * BlueDart serialises dates as `/Date(<ms-since-epoch>)/`. Accept either an
 * ISO-8601 string or that pre-formatted string and normalise downstream.
 */
export const BluedartDateSchema = z
  .string()
  .min(1)
  .describe(
    "Date as ISO-8601 (e.g. '2026-04-19T10:00:00Z') or BlueDart format '/Date(<ms>)/'."
  );

export function toBluedartDate(input: string): string {
  if (input.startsWith("/Date(")) return input;
  const ms = Date.parse(input);
  if (Number.isNaN(ms)) {
    throw new Error(
      `Invalid date '${input}'. Use ISO-8601 (e.g. 2026-04-19T10:00:00Z).`
    );
  }
  return `/Date(${ms})/`;
}

export const PickupTimeSchema = z
  .string()
  .regex(/^([01]?\d|2[0-3]):?[0-5]\d$/, "PickupTime must be HH:MM or HHMM (24h)")
  .describe("Pickup time in 24h format, either 'HH:MM' (e.g. '16:00') or 'HHMM' (e.g. '1600').");
