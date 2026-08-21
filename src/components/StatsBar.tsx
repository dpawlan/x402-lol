import { formatNumber, formatCurrency } from "@/lib/utils";

export interface SiteStats {
  totalListings: number;
  totalBids: number;
  totalClicks: number;
  totalUsdc: number;
}

export function StatsBar({ stats }: { stats: SiteStats | null }) {
  if (!stats) return null;
  const item = (label: string, value: string) => (
    <span>
      <span className="font-semibold text-stone-800">{value}</span> {label}
    </span>
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 text-center text-sm text-stone-500">
      {item(stats.totalListings === 1 ? "listing" : "listings", formatNumber(stats.totalListings))}
      <span>·</span>
      {item("bid to date", formatCurrency(stats.totalUsdc))}
      <span>·</span>
      {item(stats.totalBids === 1 ? "bid" : "bids", formatNumber(stats.totalBids))}
      <span>·</span>
      {item(stats.totalClicks === 1 ? "click" : "clicks", formatNumber(stats.totalClicks))}
      <span>·</span>
      <a href="/api/leaderboard" className="text-coral hover:underline">
        raw data →
      </a>
    </div>
  );
}
