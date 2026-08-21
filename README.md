# x402.lol

A paid leaderboard for x402 resources. Bid USDC via x402 to rank your API, agent, or tool.

**Let your agent outfit itself from a ranked list of x402 endpoints.**

## What is this?

x402.lol is a visual clone of [outbid.lol](https://outbid.lol) adapted for the x402 ecosystem. Instead of generic startup links, listings are x402-compatible resources:

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

## Quick Start

```bash
# Install dependencies
npm install

# Run in development (mock mode)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `X402_PAY_TO_ADDRESS` | Your wallet address to receive payments | (mock mode if unset) |
| `X402_FACILITATOR_URL` | x402 facilitator endpoint | `https://x402.org/facilitator` |
| `X402_NETWORK` | Network identifier (CAIP-2 format) | `eip155:8453` (Base) |
| `X402_MOCK` | Force mock mode even with address set | `false` |
| `DATABASE_PATH` | Path to SQLite database | `./data/x402.db` |

### Mock Mode vs Production

**Mock mode** (default when `X402_PAY_TO_ADDRESS` is not set):
- Bids are recorded without real payment
- Perfect for local development and testing
- UI is fully functional

**Production mode** (when `X402_PAY_TO_ADDRESS` is set):
- Bids require actual x402 payment
- Server returns HTTP 402 with payment requirements
- Client must include `Payment-Signature` header
- Settlement happens on-chain via the facilitator

## API Endpoints

### `GET /api/leaderboard`
Returns the ranked list of resources with activity and trending data.

```json
{
  "success": true,
  "data": {
    "leaderboard": [...],
    "recentActivity": [...],
    "trending": [...],
    "topBid": 50,
    "stats": { "totalListings": 10, "totalClicks": 1234, "totalBids": 246 }
  }
}
```

### `POST /api/bid`
Submit a bid for a resource. In production, requires x402 payment.

**Request:**
```json
{
  "url": "https://your-api.example.com",
  "name": "My API",
  "description": "Does cool stuff",
  "resourceUrl": "https://your-api.example.com/api/endpoint",
  "pricePerCall": "$0.001",
  "bidAmount": 10
}
```

**Response (mock mode):**
```json
{
  "success": true,
  "data": {
    "listing": { ... },
    "amountCharged": 10,
    "isNew": true,
    "paymentMode": "mock"
  }
}
```

**Response (production, no payment):**
```
HTTP 402 Payment Required
Payment-Required: { "accepts": [...], "resource": "/api/bid", "version": "2" }
```

### `GET /api/listing/[id]`
Get details for a specific listing.

### `POST /api/click/[id]`
Record a click on a listing.

### `GET /.well-known/x402`
Discovery document for agents.

```json
{
  "name": "x402.lol",
  "description": "A ranked leaderboard of x402 resources...",
  "endpoints": {
    "leaderboard": { "url": "...", "method": "GET", "paymentRequired": false },
    "bid": { "url": "...", "method": "POST", "paymentRequired": true, "accepts": [...] }
  },
  "bidRequirements": {
    "minBid": 1,
    "currency": "USDC",
    "network": "eip155:8453",
    "paymentProtocol": "x402"
  }
}
```

## Listing Schema

Each listing contains:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `url` | string | Canonical URL (unique identifier) |
| `description` | string | One-liner |
| `bidUsdc` | number | Cumulative bid in USDC |
| `lastBidAt` | string | ISO timestamp of last bid |
| `clicks` | number | Total clicks |
| `resourceUrl` | string | Actual x402 endpoint (may differ from URL) |
| `network` | string | Network (default: base) |
| `asset` | string | Payment asset (USDC) |
| `pricePerCall` | string | Resource's own x402 price |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite (better-sqlite3)
- **Payments:** x402 protocol (`@x402/next`, `@x402/core`, `@x402/evm`)
- **Deployment:** Vercel-ready

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── bid/          # Bid endpoint (x402 payment)
│   │   ├── click/[id]/   # Click tracking
│   │   ├── leaderboard/  # Get all listings
│   │   └── listing/[id]/ # Get single listing
│   ├── .well-known/x402/ # Discovery document
│   ├── about/            # About page
│   ├── rules/            # Rules page
│   └── page.tsx          # Home/leaderboard
├── components/           # React components
└── lib/
    ├── db.ts             # SQLite operations
    ├── types.ts          # TypeScript types
    ├── utils.ts          # Helpers
    └── x402.ts           # x402 configuration
```

## Deployment

### Vercel

1. Push to GitHub
2. Import in Vercel
3. Set environment variables:
   - `X402_PAY_TO_ADDRESS` — Your wallet
   - `X402_FACILITATOR_URL` — Facilitator (optional)
4. Deploy

Note: For production, use a hosted database (Turso, Neon, etc.) instead of the local SQLite file.

### Domain

The public domain will be **x402.lol** (not yet configured).

## Development

```bash
# Run dev server with hot reload
npm run dev

# Type check
npm run lint

# Build
npm run build
```

The database seeds automatically with example x402 resources on first run.

## License

MIT
