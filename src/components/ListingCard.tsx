"use client";

import { useState } from "react";
import Image from "next/image";
import { LeaderboardEntry } from "@/lib/types";
import { formatTimeAgo, getFaviconUrl, extractDomain, formatNumber, formatCurrency } from "@/lib/utils";

interface ListingCardProps {
  listing: LeaderboardEntry;
  onClaim: (listing: LeaderboardEntry) => void;
  onClick: (listing: LeaderboardEntry) => void;
}

export function ListingCard({ listing, onClaim, onClick }: ListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isTopThree = listing.rank <= 3;

  const handleClick = () => {
    onClick(listing);
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClaim(listing);
  };

  const rankColors: Record<number, string> = {
    1: "from-coral to-orange-400",
    2: "from-purple-500 to-pink-500",
    3: "from-emerald-500 to-teal-500",
  };

  return (
    <div
      className={`group relative rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-stone-800 ${
        isTopThree
          ? "border-2 border-coral/20 dark:border-coral/30"
          : "border-stone-200 dark:border-stone-700"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          {isTopThree ? (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${rankColors[listing.rank]} text-sm font-bold text-white`}
            >
              #{listing.rank}
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center text-sm font-medium text-stone-400">
              #{listing.rank}
            </div>
          )}
          <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-700">
            <Image
              src={getFaviconUrl(listing.url)}
              alt={listing.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 cursor-pointer" onClick={handleClick}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">
                {extractDomain(listing.url)}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                {listing.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                <span>{formatTimeAgo(listing.lastBidAt)}</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-coral"></span>
                  {formatNumber(listing.clicks)} clicks
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-coral">
                {formatCurrency(listing.bidUsdc)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isHovered && (
        <button
          onClick={handleClaim}
          className="absolute -right-2 -top-2 rounded-full bg-coral px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-transform hover:scale-105"
        >
          Claim for {formatCurrency(listing.bidUsdc + 1)}
        </button>
      )}
    </div>
  );
}

export function ListingCardCompact({ listing, onClaim, onClick }: ListingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 transition-all hover:shadow-sm dark:border-stone-700 dark:bg-stone-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3">
        <span className="w-6 text-sm font-medium text-stone-400">#{listing.rank}</span>
        <Image
          src={getFaviconUrl(listing.url)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 rounded"
          unoptimized
        />
        <div className="min-w-0 cursor-pointer" onClick={() => onClick(listing)}>
          <h4 className="font-medium text-stone-900 dark:text-stone-100">
            {extractDomain(listing.url)}
          </h4>
          <p className="truncate text-sm text-stone-500 dark:text-stone-400 max-w-md">
            {listing.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold text-coral">{formatCurrency(listing.bidUsdc)}</div>
          <div className="text-xs text-stone-400">
            {formatNumber(listing.clicks)} clicks
          </div>
        </div>
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClaim(listing);
            }}
            className="rounded-full bg-coral px-3 py-1.5 text-xs font-medium text-white transition-transform hover:scale-105"
          >
            Claim {formatCurrency(listing.bidUsdc + 1)}
          </button>
        )}
      </div>
    </div>
  );
}
