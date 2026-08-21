import { x402Config } from "@/lib/x402";
import { MIN_BID, MAX_BID, listingSchema, bidRequestSchema, bidResponseSchema } from "@/lib/schemas";

export { MIN_BID, MAX_BID };

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://x402.lol").replace(/\/$/, "");
export const SITE_NAME = new URL(SITE_URL).hostname;
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "";

export function buildOpenApi() {
  const contact = CONTACT_EMAIL ? { contact: { email: CONTACT_EMAIL } } : {};
  return {
    openapi: "3.1.0",
    info: {
      title: SITE_NAME,
      version: "1.0.0",
      description:
        "A paid leaderboard of x402 resources. Anyone can bid USDC via x402 to rank an API, agent, or tool; the ranked list is free to read and is designed for agents looking for x402 endpoints to use.",
      "x-guidance": [
        `${SITE_NAME} is a pay-to-rank directory of x402 resources.`,
        "",
        "To FIND resources: GET /api/leaderboard (free). It returns listings ordered by cumulative bid, each with the resource's x402 endpoint URL, network, asset and per-call price. Higher-ranked entries have paid more to be seen.",
        "",
        "To RANK a resource: POST /api/bid with JSON { url, bidAmount, name?, description?, resourceUrl?, network?, pricePerCall? }. bidAmount is a whole number of USDC (min 1). The server responds 402 with an x402 v2 PAYMENT-REQUIRED challenge priced at exactly bidAmount USDC on Base; pay it and retry with PAYMENT-SIGNATURE. Payment is verified and settled on-chain before the listing is written; the response includes the settlement txHash. Bidding again on the same url ADDS to its existing total, so you only ever pay the increment you send.",
        "",
        "POST /api/click/{id} records a click on a listing (free) and feeds the trending list.",
      ].join("\n"),
      ...contact,
    },
    servers: [{ url: SITE_URL }],
    tags: [
      { name: "Leaderboard", description: "Read the ranked list (free)" },
      { name: "Bid", description: "Pay USDC via x402 to rank a resource" },
    ],
    paths: {
      "/api/leaderboard": {
        get: {
          operationId: "getLeaderboard",
          security: [],
          summary: "Ranked list of x402 resources with recent activity and trending",
          tags: ["Leaderboard"],
          responses: {
            "200": {
              description: "Leaderboard",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          leaderboard: { type: "array", items: listingSchema },
                          topBid: { type: "number", description: "Current #1 bid in USDC" },
                          recentActivity: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "integer" },
                                listingId: { type: "integer" },
                                name: { type: "string" },
                                url: { type: "string" },
                                rank: { type: "integer" },
                                bidAmount: { type: "number" },
                                createdAt: { type: "string", format: "date-time" },
                              },
                            },
                          },
                          trending: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "integer" },
                                name: { type: "string" },
                                url: { type: "string" },
                                clicksPerHour: { type: "number" },
                              },
                            },
                          },
                          stats: {
                            type: "object",
                            properties: {
                              totalListings: { type: "integer" },
                              totalClicks: { type: "integer" },
                              totalBids: { type: "integer" },
                            },
                          },
                        },
                        required: ["leaderboard", "topBid"],
                      },
                    },
                    required: ["success", "data"],
                  },
                },
              },
            },
          },
        },
      },
      "/api/listing/{id}": {
        get: {
          operationId: "getListing",
          security: [],
          summary: "Details for a single listing",
          tags: ["Leaderboard"],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
          ],
          responses: {
            "200": {
              description: "Listing",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { success: { type: "boolean" }, data: listingSchema },
                    required: ["success", "data"],
                  },
                },
              },
            },
            "404": { description: "Listing not found" },
          },
        },
      },
      "/api/bid": {
        post: {
          operationId: "bid",
          summary: "Bid USDC via x402 to rank an x402 resource on the leaderboard",
          description:
            "Pay exactly bidAmount USDC (whole dollars, min $1) on Base to add to a URL's cumulative bid. Settled on-chain before the listing is written.",
          tags: ["Bid"],
          "x-payment-info": {
            price: {
              mode: "dynamic",
              currency: "USD",
              min: MIN_BID.toFixed(6),
              max: MAX_BID.toFixed(6),
              description: "Price equals the bidAmount field in the request body, in whole USD.",
            },
            protocols: [{ x402: {} }],
            network: x402Config.network,
            asset: "USDC",
          },
          requestBody: {
            required: true,
            content: { "application/json": { schema: bidRequestSchema } },
          },
          responses: {
            "200": {
              description: "Bid accepted and settled",
              content: { "application/json": { schema: bidResponseSchema } },
            },
            "400": { description: "Invalid request body" },
            "402": { description: "Payment Required" },
            "503": { description: "Payments not configured" },
          },
        },
      },
      "/api/click/{id}": {
        post: {
          operationId: "recordClick",
          security: [],
          summary: "Record a click on a listing (free)",
          tags: ["Leaderboard"],
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "integer" }, example: 1 },
          ],
          responses: {
            "200": {
              description: "Recorded",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { success: { type: "boolean" } }, required: ["success"] },
                },
              },
            },
            "404": { description: "Listing not found" },
          },
        },
      },
    },
  };
}

export function buildLlmsTxt(): string {
  return [
    `# ${SITE_NAME}`,
    "",
    "> Pay-to-rank leaderboard of x402 resources. Free to read; bid USDC via x402 to rank your API, agent, or tool.",
    "",
    "## Discovery",
    `- OpenAPI: ${SITE_URL}/openapi.json`,
    `- x402 discovery doc: ${SITE_URL}/.well-known/x402`,
    "",
    "## Endpoints",
    `- GET ${SITE_URL}/api/leaderboard — ranked list of x402 resources (free)`,
    `- GET ${SITE_URL}/api/listing/{id} — one listing (free)`,
    `- POST ${SITE_URL}/api/bid — pay bidAmount USDC (whole dollars, min $1) via x402 on Base to rank a URL. Re-bidding the same URL adds to its total.`,
    `- POST ${SITE_URL}/api/click/{id} — record a click (free)`,
    "",
    "## Paying",
    "POST /api/bid without a payment header returns 402 with an x402 v2 PAYMENT-REQUIRED header priced at exactly bidAmount USDC. Sign it with any x402 client (agentcash, @x402/fetch) and retry with PAYMENT-SIGNATURE. The listing is written only after on-chain settlement; the response includes txHash.",
    "",
    `## Pages`,
    `- ${SITE_URL}/ — leaderboard`,
    `- ${SITE_URL}/about`,
    `- ${SITE_URL}/rules`,
    "",
  ].join("\n");
}
