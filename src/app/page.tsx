"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { ClaimForm } from "@/components/ClaimForm";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TrendingList } from "@/components/TrendingList";
import { ListingCard, ListingCardCompact } from "@/components/ListingCard";
import { StatsBar } from "@/components/StatsBar";
import { BidModal } from "@/components/BidModal";
import type { LeaderboardEntry, Activity, TrendingItem } from "@/lib/types";

export default function Home() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [topBid, setTopBid] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<LeaderboardEntry | null>(null);
  const [onlineCount] = useState(() => Math.floor(Math.random() * 500) + 100);
  const [totalVisitors] = useState(() => Math.floor(Math.random() * 50000) + 10000);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard");
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.data.leaderboard);
        setActivities(data.data.recentActivity);
        setTrending(data.data.trending);
        setTopBid(data.data.topBid);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleQuickBid = async (url: string, amount: number) => {
    const existing = leaderboard.find(
      (l) => l.url === url || l.url === `https://${url}` || new URL(l.url).hostname === url
    );
    
    if (existing) {
      setSelectedListing(existing);
      setModalOpen(true);
    } else {
      setSelectedListing(null);
      setModalOpen(true);
    }
  };

  const handleClaim = (listing: LeaderboardEntry) => {
    setSelectedListing(listing);
    setModalOpen(true);
  };

  const handleClick = async (listing: LeaderboardEntry) => {
    try {
      await fetch(`/api/click/${listing.id}`, { method: "POST" });
      window.open(listing.url, "_blank");
    } catch (error) {
      console.error("Failed to record click:", error);
      window.open(listing.url, "_blank");
    }
  };

  const handleBidSubmit = async (data: {
    url: string;
    name: string;
    description: string;
    resourceUrl: string;
    pricePerCall: string;
    bidAmount: number;
  }) => {
    const response = await fetch("/api/bid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to submit bid");
    }

    await fetchData();
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-stone-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <StatsBar onlineCount={onlineCount} totalVisitors={totalVisitors} />
      </div>

      <div className="mb-12">
        <ClaimForm topBid={topBid} onSubmit={handleQuickBid} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <ActivityFeed activities={activities} />
        <TrendingList items={trending} />
      </div>

      <div className="space-y-4">
        {topThree.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClaim={handleClaim}
            onClick={handleClick}
          />
        ))}

        {rest.map((listing) => (
          <ListingCardCompact
            key={listing.id}
            listing={listing}
            onClaim={handleClaim}
            onClick={handleClick}
          />
        ))}

        {leaderboard.length === 0 && (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-800">
            <p className="text-stone-500 dark:text-stone-400">
              No listings yet. Be the first to claim #1!
            </p>
          </div>
        )}
      </div>

      <BidModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedListing(null);
        }}
        onSubmit={handleBidSubmit}
        existingListing={selectedListing}
        initialBidAmount={topBid + 1}
      />
    </div>
  );
}
