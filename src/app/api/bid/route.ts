import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateListing } from "@/lib/db";
import { resolveFavicon } from "@/lib/favicon";
import {
  isMockMode,
  isPaymentConfigured,
  paymentConfigProblem,
  x402Config,
  buildPaymentRequired,
  verifyAndSettleBid,
} from "@/lib/x402";

export const dynamic = "force-dynamic";

import { MIN_BID, MAX_BID } from "@/lib/openapi";

const MAX_FIELD = 200;
const MAX_DESCRIPTION = 280;

interface BidRequestBody {
  url: string;
  name?: string;
  description?: string;
  resourceUrl?: string;
  network?: string;
  pricePerCall?: string;
  bidAmount: number;
}

function bad(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeUrl(raw: string): string | null {
  let u = raw.trim();
  if (!u) return null;
  if (u.startsWith("@")) u = `https://x.com/${u.slice(1)}`;
  else if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) return null;
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const paymentHeader = request.headers.get("payment-signature");

    let body: Partial<BidRequestBody> = {};
    let bodyError: string | null = null;
    try {
      const raw = await request.text();
      body = raw.trim() ? JSON.parse(raw) : {};
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    } catch {
      bodyError = "Request body must be a JSON object";
    }

    const normalizedUrl = normalizeUrl(clean(body.url, 500));
    const bidAmountRaw = body.bidAmount === undefined ? MIN_BID : Number(body.bidAmount);
    const bidAmountValid =
      Number.isInteger(bidAmountRaw) && bidAmountRaw >= MIN_BID && bidAmountRaw <= MAX_BID;
    const bidAmount = bidAmountValid ? bidAmountRaw : MIN_BID;

    // Discovery probes (x402scan, agentcash) send empty/partial bodies with no payment header.
    // Per the x402scan spec they must reach the 402 challenge before validation rejects them,
    // so an unpaid request gets the challenge (quoted at bidAmount, or $1 if absent/invalid)
    // and validation only hard-fails once a payment is actually presented.
    if (!paymentHeader && !isMockMode() && isPaymentConfigured()) {
      const { body: required, header } = await buildPaymentRequired(bidAmount);
      return NextResponse.json(required, {
        status: 402,
        headers: { "PAYMENT-REQUIRED": header, "Cache-Control": "no-store" },
      });
    }

    if (bodyError) return bad(bodyError);
    if (!normalizedUrl) return bad("A valid http(s) URL is required");
    if (!bidAmountValid) {
      return bad(`bidAmount must be a whole number of USDC between ${MIN_BID} and ${MAX_BID}`);
    }

    const resourceUrl = body.resourceUrl ? normalizeUrl(clean(body.resourceUrl, 500)) : null;
    if (body.resourceUrl && !resourceUrl) return bad("resourceUrl must be a valid http(s) URL");

    const fields = {
      name: clean(body.name, MAX_FIELD),
      description: clean(body.description, MAX_DESCRIPTION),
      resourceUrl: resourceUrl || normalizedUrl,
      network: clean(body.network, 50) || "base",
      pricePerCall: clean(body.pricePerCall, 50) || "$0.001",
    };

    if (!isPaymentConfigured()) {
      console.error("Bid refused, payment config problem:", paymentConfigProblem());
      return bad("Payments are not configured on this server yet. Check back soon.", 503);
    }

    let payment: Awaited<ReturnType<typeof verifyAndSettleBid>> | null = null;

    if (!isMockMode()) {
      payment = await verifyAndSettleBid(paymentHeader!, bidAmount);
      if (!payment.ok) {
        if (payment.status === 402) {
          const { body: required, header } = await buildPaymentRequired(bidAmount, payment.reason);
          return NextResponse.json(required, {
            status: 402,
            headers: { "PAYMENT-REQUIRED": header, "Cache-Control": "no-store" },
          });
        }
        return bad(payment.reason, payment.status);
      }
    }

    const iconUrl = await resolveFavicon(normalizedUrl).catch(() => null);

    const result = await createOrUpdateListing(
      normalizedUrl,
      fields.name,
      fields.description,
      bidAmount,
      fields.resourceUrl,
      fields.network,
      fields.pricePerCall,
      payment?.ok ? { txHash: payment.payment.txHash, payer: payment.payment.payer } : undefined,
      iconUrl
    );

    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    if (payment?.ok) headers["PAYMENT-RESPONSE"] = payment.payment.responseHeader;

    return NextResponse.json(
      {
        success: true,
        data: {
          listing: result.listing,
          amountCharged: result.amountCharged,
          isNew: result.isNew,
          paymentMode: isMockMode() ? "mock" : "x402",
          txHash: payment?.ok ? payment.payment.txHash : null,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error("Failed to process bid:", error);
    return bad("Failed to process bid", 500);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      endpoint: "/api/bid",
      method: "POST",
      paymentProtocol: "x402",
      x402Version: 2,
      minBid: MIN_BID,
      maxBid: MAX_BID,
      increment: 1,
      currency: "USDC",
      network: x402Config.network,
      payTo: x402Config.isConfigured && !x402Config.isMock ? x402Config.payToAddress : null,
      isMock: isMockMode(),
      ready: isPaymentConfigured(),
      howTo:
        "POST the JSON body without a payment header to receive a 402 with PAYMENT-REQUIRED. " +
        "Sign it with any x402 v2 client (e.g. @x402/fetch) and retry with PAYMENT-SIGNATURE.",
      body: {
        url: "string (required) - The URL of your x402 resource",
        name: "string (optional) - Display name",
        description: "string (optional) - One-liner description",
        resourceUrl: "string (optional) - The actual x402 endpoint URL",
        network: "string (optional) - Network (default: base)",
        pricePerCall: "string (optional) - Price per API call (e.g., $0.001)",
        bidAmount: "integer (required) - Whole USDC to add to your cumulative bid",
      },
    },
  });
}
