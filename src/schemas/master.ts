import { z } from "zod";
import { BluedartDateSchema } from "./common.js";

export const PincodeMasterInputSchema = {
  last_sync_date: BluedartDateSchema.describe(
    "Only return pincode records modified after this date. ISO-8601 or '/Date(<ms>)/'. Use the epoch '1970-01-01T00:00:00Z' for a full dump."
  ),
};
