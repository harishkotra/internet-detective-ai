import { NextResponse } from "next/server";
import { getGovernanceEvents } from "@/lib/store";

export async function GET() {
  try {
    const events = getGovernanceEvents();
    return NextResponse.json({
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Failed to fetch governance data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch governance data",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
