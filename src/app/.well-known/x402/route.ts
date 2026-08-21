import { NextResponse } from "next/server";
import { x402Config } from "@/lib/x402";

export const dynamic = "force-dynamic";

export async function GET() {
  const discovery = {
    name: "x402.lol",
    description: "A ranked leaderboard of x402 resources. Pay $1 USDC via x402 to rank your API, agent, or tool.",
    version: "1.0.0",
    protocol: "x402",
    protocolVersion: "2",
    endpoints: {
      leaderboard: {
        url: "https://x402.lol/api/leaderboard",
        method: "GET",
        description: "Get the ranked list of x402 resources",
        paymentRequired: false,
      },
      bid: {
        url: "https://x402.lol/api/bid",
        method: "POST",
        description: "Submit a bid to rank your x402 resource",
        paymentRequired: true,
        accepts: [
          {
            scheme: "exact",
            network: x402Config.network,
            asset: "USDC",
            minPrice: "$1.00",
            payTo: x402Config.payToAddress,
          },
        ],
      },
      listing: {
        url: "https://x402.lol/api/listing/{id}",
        method: "GET",
        description: "Get details for a specific listing",
        paymentRequired: false,
      },
      click: {
        url: "https://x402.lol/api/click/{id}",
        method: "POST",
        description: "Record a click on a listing",
        paymentRequired: false,
      },
    },
    bidRequirements: {
      minBid: 1,
      currency: "USDC",
      network: x402Config.network,
      paymentProtocol: "x402",
      incrementSize: 1,
      description: "Bids are $1 increments paid in USDC via x402. Same identity can top up and only pays the difference.",
    },
    listingSchema: {
      required: ["url", "bidAmount"],
      optional: ["name", "description", "resourceUrl", "network", "pricePerCall"],
      fields: {
        url: "Canonical URL of the resource",
        name: "Display name",
        description: "One-liner description",
        bidUsdc: "Cumulative bid amount in USDC",
        clicks: "Total clicks",
        resourceUrl: "The actual x402 endpoint URL (may differ from homepage)",
        network: "Network (default: base)",
        asset: "Payment asset (default: USDC)",
        pricePerCall: "The resource's own x402 price per call",
      },
    },
    links: {
      homepage: "https://x402.lol",
      api: "https://x402.lol/api/leaderboard",
      rules: "https://x402.lol/rules",
    },
    contact: {
      x402Protocol: "https://x402.org",
    },
  };

  return NextResponse.json(discovery, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
