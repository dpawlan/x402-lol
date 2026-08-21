"use client";

import { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/lib/types";
import { formatCurrency, extractDomain } from "@/lib/utils";

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    url: string;
    name: string;
    description: string;
    resourceUrl: string;
    pricePerCall: string;
    bidAmount: number;
  }) => Promise<void>;
  existingListing?: LeaderboardEntry | null;
  initialBidAmount: number;
}

export function BidModal({
  isOpen,
  onClose,
  onSubmit,
  existingListing,
  initialBidAmount,
}: BidModalProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [pricePerCall, setPricePerCall] = useState("$0.001");
  const [bidAmount, setBidAmount] = useState(initialBidAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingListing) {
      setUrl(existingListing.url);
      setName(existingListing.name);
      setDescription(existingListing.description);
      setResourceUrl(existingListing.resourceUrl);
      setPricePerCall(existingListing.pricePerCall);
      setBidAmount(existingListing.bidUsdc + 1);
    } else {
      setUrl("");
      setName("");
      setDescription("");
      setResourceUrl("");
      setPricePerCall("$0.001");
      setBidAmount(initialBidAmount);
    }
  }, [existingListing, initialBidAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    if (bidAmount < 1) {
      setError("Minimum bid is $1");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        url: url.trim(),
        name: name.trim() || extractDomain(url.trim()),
        description: description.trim(),
        resourceUrl: resourceUrl.trim() || url.trim(),
        pricePerCall,
        bidAmount: existingListing ? bidAmount - existingListing.bidUsdc : bidAmount,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountToCharge = existingListing
    ? Math.max(0, bidAmount - existingListing.bidUsdc)
    : bidAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900">
            {existingListing ? "Update Listing" : "Add New Listing"}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-api.example.com"
              disabled={!!existingListing}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-coral focus:ring-1 focus:ring-coral disabled:bg-stone-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My API Service"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-coral focus:ring-1 focus:ring-coral"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your x402 resource do?"
              rows={2}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-coral focus:ring-1 focus:ring-coral"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              x402 Endpoint URL
            </label>
            <input
              type="url"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://your-api.example.com/api/endpoint"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-coral focus:ring-1 focus:ring-coral"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Price per Call
            </label>
            <input
              type="text"
              value={pricePerCall}
              onChange={(e) => setPricePerCall(e.target.value)}
              placeholder="$0.001"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:border-coral focus:ring-1 focus:ring-coral"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {existingListing ? "New Total Bid (USDC)" : "Bid Amount (USDC)"} *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBidAmount((prev) => Math.max(existingListing ? existingListing.bidUsdc + 1 : 1, prev - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
              >
                -
              </button>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Math.max(1, parseInt(e.target.value) || 1))}
                min={existingListing ? existingListing.bidUsdc + 1 : 1}
                className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-center text-lg font-semibold text-stone-900 outline-none focus:border-coral focus:ring-1 focus:ring-coral"
              />
              <button
                type="button"
                onClick={() => setBidAmount((prev) => prev + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
              >
                +
              </button>
            </div>
            {existingListing && (
              <p className="mt-1 text-sm text-stone-500">
                Current bid: {formatCurrency(existingListing.bidUsdc)} · You&apos;ll pay:{" "}
                <span className="font-semibold text-coral">{formatCurrency(amountToCharge)}</span>
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || amountToCharge < 1}
              className="flex-1 rounded-lg bg-coral px-4 py-2 font-medium text-white hover:bg-coral/90 disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : `Pay ${formatCurrency(amountToCharge)} via x402`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
