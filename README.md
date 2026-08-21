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

4. **(Optional) Enable real x402 payments**  
   Settings → Environment Variables:
   - `X402_PAY_TO_ADDRESS` — Your wallet for bid payments
   - `X402_FACILITATOR_URL` — x402 facilitator (default: `https://x402.org/facilitator`)
   - `X402_NETWORK` — Network in CAIP-2 format (default: `eip155:8453` for Base)

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

Without `DATABASE_URL`, the app uses an in-memory store seeded with example data. This ensures `npm run build` succeeds without credentials (CI/Vercel build).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production | Neon Postgres connection (auto-set by Vercel) |
| `X402_PAY_TO_ADDRESS` | No | Wallet for payments (mock mode if unset) |
| `X402_FACILITATOR_URL` | No | Facilitator endpoint |
| `X402_NETWORK` | No | CAIP-2 network (default: `eip155:8453`) |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leaderboard` | GET | Ranked list with activity and trending |
| `/api/bid` | POST | Submit bid (x402 payment in production) |
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
