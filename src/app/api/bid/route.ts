import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateListing } from "@/lib/db";
import { isMockMode, x402Config } from "@/lib/x402";

export const dynamic = "force-dynamic";

interface BidRequestBody {
  url: string;
  name?: string;
  description?: string;
  resourceUrl?: string;
  network?: string;
  pricePerCall?: string;
  bidAmount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: BidRequestBody = await request.json();

    if (!body.url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    if (!body.bidAmount || body.bidAmount < 1) {
      return NextResponse.json(
        { success: false, error: "Minimum bid is $1" },
        { status: 400 }
      );
    }

    let normalizedUrl = body.url;
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      if (normalizedUrl.startsWith("@")) {
        normalizedUrl = `https://x.com/${normalizedUrl.slice(1)}`;
      } else {
        normalizedUrl = `https://${normalizedUrl}`;
      }
    }

    const amountToCharge = body.bidAmount;

    if (amountToCharge <= 0) {
      return NextResponse.json(
        { success: false, error: "Bid amount must be positive" },
        { status: 400 }
      );
    }

    if (!isMockMode()) {
      const paymentHeader = request.headers.get("payment-signature");

      if (!paymentHeader) {
        return new NextResponse(null, {
          status: 402,
          headers: {
            "Payment-Required": JSON.stringify({
              accepts: [
                {
                  scheme: "exact",
                  network: x402Config.network,
                  price: `$${amountToCharge.toFixed(2)}`,
                  payTo: x402Config.payToAddress,
                  description: `Bid $${amountToCharge} USDC to rank on x402.lol`,
                },
              ],
              resource: `/api/bid`,
              version: "2",
            }),
            "Content-Type": "application/json",
          },
        });
      }
    }

    const result = await createOrUpdateListing(
      normalizedUrl,
      body.name || "",
      body.description || "",
      amountToCharge,
      body.resourceUrl || normalizedUrl,
      body.network || "base",
      body.pricePerCall || "$0.001"
    );

    return NextResponse.json({
      success: true,
      data: {
        listing: result.listing,
        amountCharged: result.amountCharged,
        isNew: result.isNew,
        paymentMode: isMockMode() ? "mock" : "x402",
      },
    });
  } catch (error) {
    console.error("Failed to process bid:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bid" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      endpoint: "/api/bid",
      method: "POST",
      paymentProtocol: "x402",
      minBid: 1,
      currency: "USDC",
      network: x402Config.network,
      isMock: isMockMode(),
      body: {
        url: "string (required) - The URL of your x402 resource",
        name: "string (optional) - Display name",
        description: "string (optional) - One-liner description",
        resourceUrl: "string (optional) - The actual x402 endpoint URL",
        network: "string (optional) - Network (default: base)",
        pricePerCall: "string (optional) - Price per API call (e.g., $0.001)",
        bidAmount: "number (required) - Amount to bid in USDC",
      },
    },
  });
}
