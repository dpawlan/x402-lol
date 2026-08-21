import Link from "next/link";

export const metadata = {
  title: "About - x402.lol",
  description: "Learn about x402.lol, the paid leaderboard for x402 resources.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-stone-900 dark:text-stone-100">
        About x402.lol
      </h1>

      <div className="prose prose-stone dark:prose-invert">
        <p className="text-lg text-stone-600 dark:text-stone-400">
          x402.lol is a <strong>paid leaderboard for x402 resources</strong>. APIs, agents,
          merchants, facilitators, and tools that speak the{" "}
          <a
            href="https://x402.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coral hover:underline"
          >
            x402 protocol
          </a>{" "}
          can bid to rank higher on the board.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-stone-900 dark:text-stone-100">
          What is x402?
        </h2>
        <p className="text-stone-600 dark:text-stone-400">
          x402 is an open payment protocol that uses HTTP&apos;s 402 status code to enable
          machine-to-machine payments. When a server wants payment, it responds with 402
          Payment Required. The client signs a payment authorization, retries the request,
          and the facilitator settles on-chain.
        </p>
        <p className="text-stone-600 dark:text-stone-400">
          This makes it possible for AI agents, scripts, and applications to pay for
          services programmatically without API keys, subscriptions, or credit cards.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-stone-900 dark:text-stone-100">
          Why a leaderboard?
        </h2>
        <p className="text-stone-600 dark:text-stone-400">
          As the x402 ecosystem grows, agents need a way to discover trusted endpoints.
          x402.lol provides a ranked list of resources, sorted by how much their operators
          are willing to stake on visibility.
        </p>
        <p className="text-stone-600 dark:text-stone-400">
          <strong>Let your agent outfit itself from a ranked list of x402 endpoints.</strong>
        </p>

        <h2 className="mt-8 text-xl font-semibold text-stone-900 dark:text-stone-100">
          How it works
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-stone-600 dark:text-stone-400">
          <li>Bids are <strong>$1 increments</strong> paid in USDC via x402 itself.</li>
          <li>New spots start at <strong>$1</strong>.</li>
          <li>Claiming #1 means paying $1 more than the current top bid.</li>
          <li>Re-entering the same URL only charges the difference.</li>
          <li>Paying less than #1 still places you at whatever rank that bid can buy.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-stone-900 dark:text-stone-100">
          For Agents
        </h2>
        <p className="text-stone-600 dark:text-stone-400">
          x402.lol exposes a machine-readable API at{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm dark:bg-stone-800">
            /api/leaderboard
          </code>{" "}
          and a discovery document at{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm dark:bg-stone-800">
            /.well-known/x402
          </code>
          . Agents can scrape the leaderboard, inspect resource metadata, and make
          x402 calls directly.
        </p>

        <div className="mt-8 rounded-lg bg-stone-100 p-4 dark:bg-stone-800">
          <p className="text-sm text-stone-600 dark:text-stone-400">
            <strong>Built with x402.</strong> This leaderboard accepts bids via the same
            x402 protocol it lists. Payments are settled in USDC on Base.
          </p>
        </div>

        <div className="mt-8">
          <Link
            href="/rules"
            className="text-coral hover:underline"
          >
            Read the full rules →
          </Link>
        </div>
      </div>
    </div>
  );
}
