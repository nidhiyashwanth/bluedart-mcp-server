export const SERVER_NAME = "bluedart-mcp-server";
export const SERVER_VERSION = "0.1.0";

export const DEFAULT_BASE_URL =
  "https://apigateway-sandbox.bluedart.com/in/transportation";

export const ENDPOINTS = {
  login: "/token/v1/login",
  generateWaybill: "/waybill/v1/GenerateWayBill",
  importWaybill: "/waybill/v1/ImportData",
  cancelWaybill: "/waybill/v1/CancelWaybill",
  registerPickup: "/pickup/v1/RegisterPickup",
  cancelPickup: "/cancel-pickup/v1/CancelPickup",
  transitTime: "/transit/v1/GetDomesticTransitTimeForPinCodeandProduct",
  pincodeMaster: "/masterdownload/v1/DownloadPinCodeMaster",
  tracking: "/tracking/v1",
} as const;
