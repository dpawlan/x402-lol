"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

interface ClaimFormProps {
  topBid: number;
  onSubmit: (url: string, amount: number) => Promise<void>;
  initialUrl?: string;
  initialAmount?: number;
}

export function ClaimForm({ topBid, onSubmit, initialUrl = "", initialAmount }: ClaimFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [currentBid, setCurrentBid] = useState(topBid + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAmount !== undefined) {
      setCurrentBid(initialAmount);
    } else {
      setCurrentBid(topBid + 1);
    }
  }, [topBid, initialAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL or @handle");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(url.trim(), currentBid);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementBid = () => setCurrentBid((prev) => prev + 1);
  const decrementBid = () => setCurrentBid((prev) => Math.max(1, prev - 1));

  return (
    <div className="text-center">
      <h1 className="mb-2 text-4xl font-bold text-stone-900 dark:text-stone-100">
        Claim #1 for{" "}
        <span className="inline-flex items-center gap-1">
          <button
            onClick={decrementBid}
            className="text-coral hover:text-coral/80 transition-colors"
            type="button"
          >
            -
          </button>
          <span className="text-coral">{formatCurrency(currentBid)}</span>
          <button
            onClick={incrementBid}
            className="text-coral hover:text-coral/80 transition-colors"
            type="button"
          >
            +
          </button>
        </span>
      </h1>
      <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
        <span className="text-coral">New spots start at $1.</span> Paying less than the #1 price
        still puts you on the board at whatever place that bid can take.
      </p>

      <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
        <div className="flex overflow-hidden rounded-full border border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-800">
          <div className="flex items-center pl-4 text-stone-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Your x402 resource URL or @handle"
            className="flex-1 bg-transparent px-3 py-3 text-stone-900 placeholder-stone-400 outline-none dark:text-stone-100"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-coral px-6 py-3 font-medium text-white transition-colors hover:bg-coral/90 disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Outbid"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
          Already on the list? Enter the same URL or @handle and up your bid — you only pay the
          difference.
        </p>
      </form>
    </div>
  );
}
