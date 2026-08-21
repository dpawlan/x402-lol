import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildOpenApi(), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
