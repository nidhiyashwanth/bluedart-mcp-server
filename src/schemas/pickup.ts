import { z } from "zod";
import { PhoneSchema, PincodeSchema } from "./common.js";

export const RegisterPickupInputSchema = {
  ProductCode: z
    .string()
    .min(1)
    .max(2)
    .describe("BlueDart product code for the pickup (e.g. 'A')."),
  AreaCode: z
    .string()
    .min(2)
    .max(3)
    .describe("BlueDart 3-letter area code matching the pickup pincode."),
  CustomerCode: z.string().min(1).describe("BlueDart customer code"),
  CustomerName: z.string().min(1).max(30),
  CustomerAddress1: z.string().min(1).max(30),
  CustomerAddress2: z.string().max(30).optional(),
  ContactPersonName: z.string().min(1).max(30),
  CustomerPincode: PincodeSchema,
  CustomerTelephoneNumber: PhoneSchema.optional(),
  MobileTelNo: PhoneSchema,
  ShipmentPickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .describe("Pickup date as YYYY-MM-DD"),
  ShipmentPickupTime: z
    .string()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)")
    .describe("Pickup time as HH:MM (24h)"),
  NumberofPieces: z.number().int().positive(),
  WeightofShipment: z.number().positive().describe("Weight in kg"),
  VolumeWeight: z.number().positive().describe("Volumetric weight in kg"),
  RouteCode: z.string().min(1).max(4).default("99"),
  isToPayShipper: z.boolean().default(false),
};

export const CancelPickupInputSchema = {
  token_number: z
    .string()
    .min(1)
    .describe("Pickup token number returned by RegisterPickup."),
  shipment_pickup_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .describe("Original pickup date (YYYY-MM-DD) used at registration."),
};
