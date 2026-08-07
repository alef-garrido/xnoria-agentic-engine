import { filterFetch } from "@/lib/service-client";

// GET /api/filter/allowlist → proxy to GET /filter/allowlist
export function GET() {
  return filterFetch("/filter/allowlist", { logMessage: "Failed to proxy allowlist list request" });
}

// POST /api/filter/allowlist → proxy to POST /filter/allowlist
export async function POST(request: Request) {
  const body = await request.json();
  return filterFetch("/filter/allowlist", {
    method: "POST",
    body,
    passThroughErrors: false,
    logMessage: "Failed to proxy allowlist create request",
  });
}
