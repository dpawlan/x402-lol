import { NextResponse } from "next/server";
import { getLeaderboard, getRecentActivity, getTrending, getTopBid, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leaderboard = getLeaderboard();
    const recentActivity = getRecentActivity(5);
    const trending = getTrending(5);
    const topBid = getTopBid();
    const stats = getStats();

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
