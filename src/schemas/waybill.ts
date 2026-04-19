import { z } from "zod";
import {
  BluedartDateSchema,
  PhoneSchema,
  PickupTimeSchema,
  PincodeSchema,
} from "./common.js";

const ConsigneeSchema = z
  .object({
    ConsigneeName: z.string().min(1).max(30).describe("Recipient name (max 30 chars)"),
    ConsigneeAddress1: z.string().min(1).max(90).describe("Address line 1"),
    ConsigneeAddress2: z.string().max(90).optional().describe("Address line 2"),
    ConsigneeAddress3: z.string().max(90).optional().describe("Address line 3"),
    ConsigneePincode: PincodeSchema.describe("Recipient pincode"),
    ConsigneeMobile: PhoneSchema.describe("Recipient mobile"),
    ConsigneeTelephone: PhoneSchema.optional(),
    ConsigneeEmailID: z.string().email().max(50).optional(),
    ConsigneeCityName: z.string().max(20).optional(),
    ConsigneeAddressType: z
      .string()
      .max(1)
      .optional()
      .describe("'R' (residential) or 'C' (commercial), if applicable"),
    ConsigneeGSTNumber: z.string().max(15).optional(),
    AvailableDays: z.string().optional(),
    AvailableTiming: z.string().optional(),
  })
  .strict();

const ShipperSchema = z
  .object({
    OriginArea: z
      .string()
      .min(2)
      .max(3)
      .describe("BlueDart 3-letter origin area code (e.g. 'BOM', 'DEL'). Must match the shipper pincode region."),
    CustomerCode: z
      .string()
      .min(1)
      .describe("BlueDart customer code (a.k.a. CRC, billing customer code)"),
    CustomerName: z.string().min(1).max(30),
    CustomerAddress1: z.string().min(1).max(90),
    CustomerAddress2: z.string().max(90).optional(),
    CustomerAddress3: z.string().max(90).optional(),
    CustomerPincode: PincodeSchema,
    CustomerTelephone: PhoneSchema.optional(),
    CustomerMobile: PhoneSchema,
    CustomerEmailID: z.string().email().max(50).optional(),
    IsToPayCustomer: z.boolean().default(false),
    Sender: z.string().max(20).optional(),
    VendorCode: z.string().max(9).optional(),
    CustomerGSTNumber: z.string().max(15).optional(),
  })
  .strict();

const ReturnAddressSchema = z
  .object({
    ManifestNumber: z.string().optional().default(""),
    ReturnAddress1: z.string().min(1).max(90),
    ReturnAddress2: z.string().max(90).optional(),
    ReturnAddress3: z.string().max(90).optional(),
    ReturnPincode: PincodeSchema,
    ReturnMobile: PhoneSchema,
    ReturnTelephone: PhoneSchema.optional(),
    ReturnContact: z.string().max(20).optional(),
    ReturnEmailID: z.string().email().max(50).optional(),
  })
  .strict();

const DimensionSchema = z
  .object({
    Length: z.number().positive().describe("cm"),
    Breadth: z.number().positive().describe("cm"),
    Height: z.number().positive().describe("cm"),
    Count: z.number().int().positive().default(1),
  })
  .strict();

const ItemDetailSchema = z
  .object({
    ItemID: z.string().max(15),
    ItemName: z.string().max(50),
    ProductDesc1: z.string().max(50).optional(),
    ProductDesc2: z.string().max(50).optional(),
    ItemValue: z.number().nonnegative(),
    Itemquantity: z.number().int().positive(),
    InvoiceNumber: z.string().max(15).optional(),
    InvoiceDate: BluedartDateSchema.optional(),
    SellerName: z.string().max(30).optional(),
    SellerGSTNNumber: z.string().max(15).optional(),
    docType: z.string().default("INV").optional(),
    subSupplyType: z.number().int().optional(),
    supplyType: z.string().optional(),
  })
  .strict();

const ServicesSchema = z
  .object({
    ProductCode: z
      .string()
      .min(1)
      .max(2)
      .describe(
        "BlueDart product code: 'A' (Apex/B2C), 'D' (Dart Apex), 'E' (B2B), etc. See BlueDart product master."
      ),
    ProductType: z
      .union([z.literal(0), z.literal(1)])
      .describe("0 = DOX (documents), 1 = NDOX (non-document parcels)"),
    SubProductCode: z
      .string()
      .max(2)
      .optional()
      .describe("Sub-product: 'P' for Prepaid, 'C' for COD, etc."),
    PieceCount: z.number().int().positive(),
    ActualWeight: z
      .number()
      .positive()
      .describe("Weight in kilograms (BlueDart expects kg, not grams)"),
    DeclaredValue: z.number().nonnegative().optional(),
    CollectableAmount: z
      .number()
      .nonnegative()
      .optional()
      .describe("COD amount; set 0 for prepaid"),
    CreditReferenceNo: z
      .string()
      .min(1)
      .max(20)
      .describe(
        "Your unique reference for this shipment (alphanumeric, max 20). Reuse causes 'Waybill already generated'."
      ),
    Commodity: z
      .object({
        CommodityDetail1: z.string().max(30).optional(),
        CommodityDetail2: z.string().max(30).optional(),
        CommodityDetail3: z.string().max(30).optional(),
      })
      .strict()
      .optional(),
    Dimensions: z.array(DimensionSchema).optional().default([]),
    PickupDate: BluedartDateSchema.describe("Pickup date (ISO-8601 or BlueDart format)"),
    PickupTime: PickupTimeSchema,
    RegisterPickup: z.boolean().default(false),
    PDFOutputNotRequired: z
      .boolean()
      .default(false)
      .describe("Set true to skip the AWB PDF in the response (smaller payload)."),
    SpecialInstruction: z.string().max(100).optional(),
    PackType: z.string().max(2).optional(),
    OTPBasedDelivery: z.union([z.literal(0), z.literal(1), z.literal(2), z.string()]).optional(),
    OTPCode: z.string().optional(),
    itemdtl: z.array(ItemDetailSchema).optional().default([]),
    noOfDCGiven: z.number().int().nonnegative().default(0),
  })
  .strict();

const SingleWaybillRequestSchema = z
  .object({
    Consignee: ConsigneeSchema,
    Shipper: ShipperSchema,
    Returnadds: ReturnAddressSchema,
    Services: ServicesSchema,
  })
  .strict();

export const GenerateWaybillInputSchema = SingleWaybillRequestSchema.shape;

export const ImportWaybillInputSchema = {
  shipments: z
    .array(SingleWaybillRequestSchema)
    .min(1)
    .max(50)
    .describe("Array of waybill requests to create in one call (1-50)."),
};

export const CancelWaybillInputSchema = {
  awb_no: z
    .string()
    .min(6)
    .max(20)
    .describe("BlueDart Air Waybill (AWB) number to cancel."),
};

export type SingleWaybillRequest = z.infer<typeof SingleWaybillRequestSchema>;
