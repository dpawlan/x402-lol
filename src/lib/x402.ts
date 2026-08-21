import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import type { PaymentPayload, PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { declareDiscoveryExtension, bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { bidRequestSchema, bidRequestExample, bidResponseSchema, bidResponseExample } from "@/lib/schemas";

type Network = `${string}:${string}`;

const PAY_TO_ADDRESS = process.env.X402_PAY_TO_ADDRESS || "";
const NETWORK = (process.env.X402_NETWORK || "eip155:8453") as Network;
const CDP_KEY_ID = process.env.CDP_API_KEY_ID;
const CDP_KEY_SECRET = process.env.CDP_API_KEY_SECRET;
const FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL ||
  (CDP_KEY_ID && CDP_KEY_SECRET
    ? "https://api.cdp.coinbase.com/platform/v2/x402"
    : "https://x402.org/facilitator");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://x402.lol";

/**
 * Mock mode skips payment entirely. It is ONLY allowed when explicitly opted into
 * (X402_MOCK=true) or when running outside production without a wallet configured.
 * In production with no wallet, bids are refused rather than given away for free.
 */
const IS_MOCK =
  process.env.X402_MOCK === "true" ||
  (process.env.NODE_ENV !== "production" && !PAY_TO_ADDRESS);

const HAS_CDP = Boolean(CDP_KEY_ID && CDP_KEY_SECRET);
const TESTNET = "eip155:84532";
// x402.org only settles Base Sepolia. Any other network needs CDP keys or an explicit facilitator.
const FACILITATOR_SUPPORTS_NETWORK =
  NETWORK === TESTNET || HAS_CDP || Boolean(process.env.X402_FACILITATOR_URL);

const IS_CONFIGURED =
  IS_MOCK || (/^0x[0-9a-fA-F]{40}$/.test(PAY_TO_ADDRESS) && FACILITATOR_SUPPORTS_NETWORK);

export function paymentConfigProblem(): string | null {
  if (IS_MOCK) return null;
  if (!/^0x[0-9a-fA-F]{40}$/.test(PAY_TO_ADDRESS)) return "X402_PAY_TO_ADDRESS is not set";
  if (!FACILITATOR_SUPPORTS_NETWORK)
    return `No facilitator for ${NETWORK}: set CDP_API_KEY_ID/CDP_API_KEY_SECRET (or X402_FACILITATOR_URL)`;
  return null;
}

let server: x402ResourceServer | null = null;
let initPromise: Promise<void> | null = null;

function getServer(): x402ResourceServer {
  if (server) return server;
  const facilitatorConfig =
    HAS_CDP
      ? { ...createFacilitatorConfig(CDP_KEY_ID, CDP_KEY_SECRET), url: FACILITATOR_URL }
      : { url: FACILITATOR_URL };
  const facilitator = new HTTPFacilitatorClient(facilitatorConfig);
  server = new x402ResourceServer(facilitator)
    .register(NETWORK, new ExactEvmScheme())
    .registerExtension(bazaarResourceServerExtension);
  return server;
}

async function getInitializedServer(): Promise<x402ResourceServer> {
  const s = getServer();
  if (!initPromise) {
    initPromise = s.initialize().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return s;
}

export function isMockMode(): boolean {
  return IS_MOCK;
}

export function isPaymentConfigured(): boolean {
  return IS_CONFIGURED;
}

export const x402Config = {
  facilitatorUrl: FACILITATOR_URL,
  payToAddress: PAY_TO_ADDRESS,
  network: NETWORK,
  isMock: IS_MOCK,
  isConfigured: IS_CONFIGURED,
};

const SITE_NAME = new URL(SITE_URL).hostname;

function bidResourceInfo(amountUsdc: number) {
  return {
    url: `${SITE_URL}/api/bid`,
    description: `Bid $${amountUsdc.toFixed(2)} USDC to rank an x402 resource on ${SITE_NAME}. Price equals the bidAmount in the request body (whole USD, min $1). Re-bidding the same url adds to its total.`,
    mimeType: "application/json",
    serviceName: SITE_NAME,
    tags: ["x402", "leaderboard", "directory", "discovery", "advertising"],
  };
}

/** Bazaar discovery extension: carries input/output schema on every 402 so agents can invoke blind. */
const bidDiscoveryExtension = declareDiscoveryExtension({
  bodyType: "json",
  input: { ...bidRequestExample },
  inputSchema: bidRequestSchema as unknown as Record<string, unknown>,
  output: {
    example: bidResponseExample,
    schema: bidResponseSchema as unknown as Record<string, unknown>,
  },
});

export async function buildBidRequirements(amountUsdc: number): Promise<PaymentRequirements[]> {
  const s = await getInitializedServer();
  return s.buildPaymentRequirements({
    scheme: "exact",
    network: NETWORK,
    payTo: PAY_TO_ADDRESS,
    price: `$${amountUsdc.toFixed(2)}`,
    maxTimeoutSeconds: 300,
  });
}

export async function buildPaymentRequired(
  amountUsdc: number,
  error?: string
): Promise<{ body: PaymentRequired; header: string }> {
  const s = await getInitializedServer();
  const requirements = await buildBidRequirements(amountUsdc);
  const body = await s.createPaymentRequiredResponse(
    requirements,
    bidResourceInfo(amountUsdc),
    error,
    bidDiscoveryExtension
  );
  return { body, header: encodePaymentRequiredHeader(body) };
}

export type SettledPayment = {
  txHash: string;
  payer: string | null;
  network: string;
  amountAtomic: string;
  responseHeader: string;
};

export type PaymentOutcome =
  | { ok: true; payment: SettledPayment }
  | { ok: false; status: 402 | 400; reason: string };

/**
 * Verifies and settles an x402 payment for a bid of `amountUsdc`.
 * Settlement happens BEFORE the caller writes anything, so a failed settlement
 * can never produce a free listing.
 */
export async function verifyAndSettleBid(
  paymentSignatureHeader: string,
  amountUsdc: number
): Promise<PaymentOutcome> {
  const s = await getInitializedServer();

  let payload: PaymentPayload;
  try {
    payload = decodePaymentSignatureHeader(paymentSignatureHeader);
  } catch {
    return { ok: false, status: 400, reason: "Malformed PAYMENT-SIGNATURE header" };
  }

  const requirements = await buildBidRequirements(amountUsdc);
  const matched = s.findMatchingRequirements(requirements, payload);
  if (!matched) {
    return {
      ok: false,
      status: 402,
      reason: `Payment does not match requirements (expected $${amountUsdc.toFixed(2)} USDC on ${NETWORK} to ${PAY_TO_ADDRESS})`,
    };
  }

  const verify = await s.verifyPayment(payload, matched);
  if (!verify.isValid) {
    return {
      ok: false,
      status: 402,
      reason: verify.invalidMessage || verify.invalidReason || "Payment verification failed",
    };
  }

  const settle = await s.settlePayment(payload, matched);
  if (!settle.success) {
    return {
      ok: false,
      status: 402,
      reason: settle.errorMessage || settle.errorReason || "Payment settlement failed",
    };
  }

  return {
    ok: true,
    payment: {
      txHash: settle.transaction,
      payer: settle.payer ?? verify.payer ?? null,
      network: settle.network,
      amountAtomic: settle.amount ?? matched.amount,
      responseHeader: encodePaymentResponseHeader(settle),
    },
  };
}
