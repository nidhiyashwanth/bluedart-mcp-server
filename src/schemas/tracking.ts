import { z } from "zod";
import { ResponseFormatSchema } from "./common.js";

export const TrackShipmentInputSchema = {
  awb_number: z
    .string()
    .min(6)
    .max(20)
    .describe("BlueDart Air Waybill (AWB) number to track."),
  include_scans: z
    .boolean()
    .default(true)
    .describe("Include scan-by-scan tracking events in the response."),
  response_format: ResponseFormatSchema,
};
