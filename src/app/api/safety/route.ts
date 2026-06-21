import { NextResponse } from "next/server";
import { getSafetyEvents } from "@/lib/store";

export async function GET() {
  try {
    const events = getSafetyEvents();
    return NextResponse.json({
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Failed to fetch safety data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch safety data",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
