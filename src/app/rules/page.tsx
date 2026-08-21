export const metadata = {
  title: "Rules - x402.lol",
  description: "The rules for listing and bidding on x402.lol.",
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-stone-900">
        Rules
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            1. Eligible Resources
          </h2>
          <p className="text-stone-600">
            Only x402-compatible resources may be listed. This includes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-600">
            <li>APIs that respond with HTTP 402 and accept x402 payments</li>
            <li>AI agents that can make or receive x402 payments</li>
            <li>Merchants and services accepting x402</li>
            <li>Facilitators providing x402 settlement</li>
            <li>Tools and SDKs for building x402 applications</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            2. Bidding
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-stone-600">
            <li>
              <strong>Minimum bid:</strong> $1 USDC
            </li>
            <li>
              <strong>Increment:</strong> $1 at a time
            </li>
            <li>
              <strong>Payment:</strong> Via x402 protocol, settled in USDC on Base
            </li>
            <li>
              <strong>Top-up:</strong> Re-entering the same URL only charges the difference
              between your current bid and the new total
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            3. Ranking
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-stone-600">
            <li>Resources are ranked by cumulative bid amount (highest first)</li>
            <li>Ties are broken by earliest bid timestamp</li>
            <li>Claiming a specific rank requires bidding at least $1 more than that rank</li>
            <li>Paying less than #1 places you at whatever rank your bid can afford</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            4. Listing Information
          </h2>
          <p className="text-stone-600">
            Each listing includes:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-600">
            <li>
              <strong>Name:</strong> Display name for the resource
            </li>
            <li>
              <strong>URL:</strong> Canonical URL (used as unique identifier)
            </li>
            <li>
              <strong>Description:</strong> One-liner explaining what it does
            </li>
            <li>
              <strong>Bid:</strong> Cumulative USDC bid amount
            </li>
            <li>
              <strong>Clicks:</strong> Total outbound clicks
            </li>
            <li>
              <strong>Resource URL:</strong> The actual x402 endpoint (may differ from homepage)
            </li>
            <li>
              <strong>Price per Call:</strong> The resource&apos;s own x402 price
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            5. Machine Access
          </h2>
          <p className="text-stone-600">
            Agents and scripts can access:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-stone-600">
            <li>
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">
                GET /api/leaderboard
              </code>{" "}
              — Full ranked list with metadata
            </li>
            <li>
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">
                GET /.well-known/x402
              </code>{" "}
              — Discovery document
            </li>
            <li>
              <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">
                POST /api/bid
              </code>{" "}
              — Submit a bid (x402 payment required)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            6. No Refunds
          </h2>
          <p className="text-stone-600">
            All bids are final. Once a payment settles on-chain, it cannot be reversed.
            Make sure your listing information is correct before bidding.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            7. Content Policy
          </h2>
          <p className="text-stone-600">
            Resources must be legal and not primarily designed for harm. We reserve the
            right to remove listings that violate this policy (bids are not refunded).
          </p>
        </section>
      </div>
    </div>
  );
}
