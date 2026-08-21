import { NextResponse } from "next/server";
import { getLeaderboard, getRecentActivity, getTrending, getTopBid, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [leaderboard, recentActivity, trending, topBid, stats] = await Promise.all([
      getLeaderboard(),
      getRecentActivity(5),
      getTrending(5),
      getTopBid(),
      getStats(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        recentActivity,
        trending,
        topBid,
        stats,
      },
    });
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
