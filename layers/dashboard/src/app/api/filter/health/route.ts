import { filterFetch } from "@/lib/service-client";

// GET /api/filter/health → proxy to GET /filter/health
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") ?? "30";
  return filterFetch(`/filter/health?days=${days}`, {
    logMessage: "Failed to proxy health metrics to filter service",
  });
}
