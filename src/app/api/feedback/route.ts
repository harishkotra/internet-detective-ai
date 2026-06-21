import { NextRequest, NextResponse } from "next/server";
import type { UserFeedback } from "@/lib/types";

interface FeedbackEntry {
  id: string;
  investigationId: string;
  feedback: UserFeedback;
  createdAt: string;
}

const feedbackStore: FeedbackEntry[] = [];
const MAX_FEEDBACK = 10_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.investigationId || typeof body.investigationId !== "string") {
      return NextResponse.json(
        { error: "investigationId is required" },
        { status: 400 },
      );
    }

    if (typeof body.approved !== "boolean") {
      return NextResponse.json(
        { error: "approved (boolean) is required" },
        { status: 400 },
      );
    }

    const feedback: UserFeedback = {
      approved: body.approved,
      corrections:
        typeof body.corrections === "string" ? body.corrections : undefined,
      rating:
        typeof body.rating === "number"
          ? Math.min(5, Math.max(1, body.rating))
          : 3,
      timestamp: new Date().toISOString(),
    };

    const entry: FeedbackEntry = {
      id: `${body.investigationId}-${Date.now()}`,
      investigationId: body.investigationId,
      feedback,
      createdAt: new Date().toISOString(),
    };

    feedbackStore.push(entry);
    if (feedbackStore.length > MAX_FEEDBACK) {
      feedbackStore.splice(0, feedbackStore.length - MAX_FEEDBACK);
    }

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 });
  } catch (error) {
    console.error("Failed to save feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback", message: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const total = feedbackStore.length;
    const approved = feedbackStore.filter((e) => e.feedback.approved).length;
    const rejected = total - approved;
    const ratings = feedbackStore.map((e) => e.feedback.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r, 0) / ratings.length
        : 0;

    const recent = feedbackStore
      .slice(-10)
      .reverse()
      .map((e) => ({
        id: e.id,
        investigationId: e.investigationId,
        feedback: e.feedback,
        createdAt: e.createdAt,
      }));

    return NextResponse.json({
      stats: {
        total,
        approved,
        rejected,
        avgRating: Math.round(avgRating * 100) / 100,
      },
      recent,
    });
  } catch (error) {
    console.error("Failed to fetch feedback stats:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch feedback stats",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
