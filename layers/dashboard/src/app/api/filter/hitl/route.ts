import { filterFetch } from "@/lib/service-client";

// GET /api/filter/hitl → proxy to GET /filter/hitl/pending
export function GET() {
  return filterFetch("/filter/hitl/pending", {
    logMessage: "Failed to proxy HITL pending requests",
  });
}
