export const MIN_BID = 1;
export const MAX_BID = 10_000;

export const listingSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    rank: { type: "integer", description: "1 = top of the leaderboard" },
    name: { type: "string" },
    url: { type: "string", format: "uri", description: "Canonical URL of the resource" },
    description: { type: "string" },
    bidUsdc: { type: "number", description: "Cumulative USDC bid. Higher = ranked higher." },
    lastBidAt: { type: "string", format: "date-time" },
    clicks: { type: "integer" },
    resourceUrl: { type: "string", format: "uri", description: "The actual x402 endpoint URL" },
    network: { type: "string", description: "Network the resource accepts payment on (e.g. base)" },
    asset: { type: "string", description: "Payment asset (e.g. USDC)" },
    pricePerCall: { type: "string", description: "The resource's own price per call, e.g. $0.001" },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "name", "url", "bidUsdc", "resourceUrl", "network", "asset"],
} as const;

export const bidRequestSchema = {
  type: "object",
  properties: {
    url: {
      type: "string",
      minLength: 4,
      description: "Homepage or canonical URL of the x402 resource you are ranking (a bare domain is accepted).",
      example: "https://example-x402-api.com",
    },
    bidAmount: {
      type: "integer",
      minimum: MIN_BID,
      maximum: MAX_BID,
      description:
        "Whole USDC to add to this URL's cumulative bid. New URLs start at $1. Re-bidding the same URL adds to its total (you only pay the amount you send).",
      example: 1,
    },
    name: { type: "string", maxLength: 200, description: "Display name", example: "Example API" },
    description: {
      type: "string",
      maxLength: 280,
      description: "One-line description of what the resource does",
      example: "Pay-per-call weather data via x402",
    },
    resourceUrl: {
      type: "string",
      format: "uri",
      description: "The actual x402-gated endpoint, if different from url",
      example: "https://example-x402-api.com/api/weather",
    },
    network: { type: "string", maxLength: 50, description: "Network the resource settles on", example: "base" },
    pricePerCall: {
      type: "string",
      maxLength: 50,
      description: "The resource's own per-call price, for display",
      example: "$0.001",
    },
  },
  required: ["url", "bidAmount"],
} as const;


export const bidResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        listing: listingSchema,
        amountCharged: { type: "number", description: "USDC charged for this bid" },
        isNew: { type: "boolean", description: "true if this URL was not listed before" },
        paymentMode: { type: "string", enum: ["x402", "mock"] },
        txHash: { type: ["string", "null"], description: "On-chain settlement transaction hash" },
      },
      required: ["listing", "amountCharged", "isNew"],
    },
  },
  required: ["success", "data"],
} as const;

export const bidRequestExample = {
  url: "https://example-x402-api.com",
  bidAmount: 1,
  name: "Example API",
  description: "Pay-per-call weather data via x402",
  resourceUrl: "https://example-x402-api.com/api/weather",
  network: "base",
  pricePerCall: "$0.001",
};

export const bidResponseExample = {
  success: true,
  data: {
    listing: {
      id: 1,
      rank: 1,
      name: "Example API",
      url: "https://example-x402-api.com",
      description: "Pay-per-call weather data via x402",
      bidUsdc: 1,
      lastBidAt: "2026-08-21T15:58:48.181Z",
      clicks: 0,
      resourceUrl: "https://example-x402-api.com/api/weather",
      network: "base",
      asset: "USDC",
      pricePerCall: "$0.001",
      createdAt: "2026-08-21T15:58:48.181Z",
    },
    amountCharged: 1,
    isNew: true,
    paymentMode: "x402",
    txHash: "0x082a4b68ec1d5d08248c72238e3f8122334722a5f671cb51946638a24536d015",
  },
};
