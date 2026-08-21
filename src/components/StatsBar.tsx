"use client";

import { formatNumber } from "@/lib/utils";

interface StatsBarProps {
  onlineCount: number;
  totalVisitors: number;
}

export function StatsBar({ onlineCount, totalVisitors }: StatsBarProps) {
  return (
    <div className="text-center text-sm text-stone-500 dark:text-stone-400">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
        <span className="text-green-600 dark:text-green-400">{formatNumber(onlineCount)} online</span>
      </span>
      <span className="mx-2">·</span>
      <span>{formatNumber(totalVisitors)} visitors since launch</span>
      <span className="mx-2">·</span>
      <a href="/api/leaderboard" className="text-coral hover:underline">see stats →</a>
    </div>
  );
}
