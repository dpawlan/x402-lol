import { x402ResourceServer } from "@x402/next";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || "https://x402.org/facilitator";
const PAY_TO_ADDRESS = process.env.X402_PAY_TO_ADDRESS || "0x0000000000000000000000000000000000000000";
const NETWORK = (process.env.X402_NETWORK || "eip155:8453") as `${string}:${string}`;
const IS_MOCK = !process.env.X402_PAY_TO_ADDRESS || process.env.X402_MOCK === "true";

let server: x402ResourceServer | null = null;

export function getX402Server(): x402ResourceServer {
  if (server) return server;

  if (IS_MOCK) {
    server = createMockServer();
  } else {
    const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
    server = new x402ResourceServer(facilitator);
    server.register(NETWORK, new ExactEvmScheme());
  }

  return server;
}

function createMockServer(): x402ResourceServer {
  const mockFacilitator = {
    async verify() {
      return { valid: true };
    },
    async settle() {
      return { settled: true, txHash: "0xmock" };
    },
  } as unknown as HTTPFacilitatorClient;

  const mockServer = new x402ResourceServer(mockFacilitator);
  mockServer.register(NETWORK, new ExactEvmScheme());
  return mockServer;
}

export function getPaymentConfig(priceUsdc: number) {
  return {
    accepts: {
      scheme: "exact" as const,
      price: `$${priceUsdc.toFixed(2)}`,
      network: NETWORK,
      payTo: PAY_TO_ADDRESS,
    },
    description: `Bid $${priceUsdc} USDC to rank on x402.lol`,
  };
}

export function isMockMode(): boolean {
  return IS_MOCK;
}

export const x402Config = {
  facilitatorUrl: FACILITATOR_URL,
  payToAddress: PAY_TO_ADDRESS,
  network: NETWORK,
  isMock: IS_MOCK,
};
