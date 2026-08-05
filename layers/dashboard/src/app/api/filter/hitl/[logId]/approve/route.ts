import { filterFetch, readOptionalJson } from "@/lib/service-client";

// POST /api/filter/hitl/[logId]/approve → proxy to POST /filter/hitl/:logId/approve
// Optional body: { payload: { ... } } — operator-edited payload override
export async function POST(request: Request, { params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params;
  const body = await readOptionalJson(request);
  return filterFetch(`/filter/hitl/${logId}/approve`, {
    method: "POST",
    // Forward the body as-is (may contain payload override); empty → original payload
    body: body ?? {},
    passThroughErrors: false,
    logMessage: "Failed to proxy HITL approve request",
    logContext: { logId },
  });
}
