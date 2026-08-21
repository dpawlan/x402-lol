import { NextRequest, NextResponse } from "next/server";
import { recordClick, getListingById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listingId = parseInt(id, 10);

    if (isNaN(listingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid listing ID" },
        { status: 400 }
      );
    }

    const listing = getListingById(listingId);
    if (!listing) {
      return NextResponse.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    recordClick(listingId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record click:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record click" },
      { status: 500 }
    );
  }
}
