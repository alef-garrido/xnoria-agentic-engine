import { NextResponse } from "next/server";
import { memoryFetch } from "@/lib/service-client";

// GET /api/memory?contact_id=X&stage=Y → proxy to GET /memory/search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contact_id = searchParams.get("contact_id");
  const stage = searchParams.get("stage");

  if (!contact_id) {
    return NextResponse.json(
      { error: "MISSING_CONTACT_ID", message: "Missing required parameter: contact_id" },
      { status: 400 }
    );
  }

  // Build the query string
  const queryParams = new URLSearchParams();
  queryParams.set("contact_id", contact_id);
  if (stage) queryParams.set("stage", stage);

  return memoryFetch(`/memory/search?${queryParams}`, {
    logMessage: "Failed to proxy memory search to cognitive service",
  });
}
