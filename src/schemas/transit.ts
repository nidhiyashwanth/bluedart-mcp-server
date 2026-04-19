import { z } from "zod";
import { PincodeSchema } from "./common.js";

export const TransitTimeInputSchema = {
  origin_pincode: PincodeSchema.describe("Pickup pincode"),
  destination_pincode: PincodeSchema.describe("Delivery pincode"),
  product_code: z
    .string()
    .min(1)
    .max(2)
    .default("A")
    .describe("BlueDart product code (default 'A')."),
  sub_product_code: z
    .string()
    .max(2)
    .default("P")
    .describe("Sub-product code: 'P' for prepaid, 'C' for COD, etc."),
  pickup_date: z
    .string()
    .optional()
    .describe("Pickup date as ISO-8601 (e.g. '2026-04-19'). Defaults to today."),
  pickup_time: z
    .string()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)")
    .default("16:00")
    .describe("Pickup time as HH:MM (24h)."),
};
