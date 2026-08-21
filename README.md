# x402.lol

A paid leaderboard for x402 resources. Bid USDC via x402 to rank your API, agent, or tool.

**Let your agent outfit itself from a ranked list of x402 endpoints.**

## Deploy to Vercel

1. **Import the repo**  
   Go to [vercel.com/new](https://vercel.com/new) and import `https://github.com/dpawlan/x402-lol`

2. **Add Neon Postgres**  
   In your Vercel project dashboard → Storage → Add → Neon Postgres  
   This automatically sets `DATABASE_URL`

3. **Deploy**  
   Click Deploy. That's it.

4. **Enable x402 payments (required — bids are refused in production without it)**  
   Settings → Environment Variables:
   - `X402_PAY_TO_ADDRESS` — Your wallet for bid payments
   - `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` — Coinbase CDP key for the mainnet facilitator ([portal.cdp.coinbase.com](https://portal.cdp.coinbase.com))
   - `X402_NETWORK` — CAIP-2 network (default: `eip155:8453` Base mainnet; `eip155:84532` for Sepolia testing via the free x402.org facilitator)
   - `NEXT_PUBLIC_SITE_URL` — `https://x402.lol`

5. **(Later) Custom domain**  
   Settings → Domains → Add `x402.lol`

## What is this?

x402.lol is a visual clone of [outbid.lol](https://outbid.lol) for the x402 ecosystem:

- APIs that respond with HTTP 402
- AI agents that make/receive x402 payments
- Merchants accepting x402
- Facilitators providing settlement
- Tools and SDKs for x402

## How it works

- **$1 minimum bid** — New spots start at $1 USDC
- **$1 increments** — Bids go up $1 at a time
- **Pay via x402** — The leaderboard itself uses x402 for payments
- **Pay the difference** — Re-entering the same URL only charges the delta
- **Rank by bid** — Higher cumulative bid = higher rank

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without `DATABASE_URL`, the app uses an in-memory store seeded with example data, and without `X402_PAY_TO_ADDRESS` it runs in mock-payment mode (non-production only). This ensures `npm run build` succeeds without credentials (CI/Vercel build).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production | Neon Postgres connection (auto-set by Vercel) |
| `X402_PAY_TO_ADDRESS` | Production | Wallet for payments (bids return 503 if unset in prod) |
| `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` | Mainnet | Coinbase CDP facilitator credentials |
| `X402_FACILITATOR_URL` | No | Override facilitator URL |
| `NEXT_PUBLIC_SITE_URL` | No | Public origin for the 402 resource descriptor |
| `X402_MOCK` | No | `true` skips payments (dev only) |
| `SEED_DEMO_DATA` | No | `true` seeds demo listings into an empty DB |
| `X402_NETWORK` | No | CAIP-2 network (default: `eip155:8453`) |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboard` | GET | Ranked list with activity and trending |
| `/api/bid` | POST | Submit bid — returns 402 + `PAYMENT-REQUIRED`; retry with `PAYMENT-SIGNATURE` (x402 v2) |
| `/api/listing/[id]` | GET | Single listing details |
| `/api/click/[id]` | POST | Record click |
| `/.well-known/x402` | GET | Discovery document for agents |

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- Neon Postgres (serverless)
- x402 SDK (`@x402/next`, `@x402/core`, `@x402/evm`)

## License

MIT
