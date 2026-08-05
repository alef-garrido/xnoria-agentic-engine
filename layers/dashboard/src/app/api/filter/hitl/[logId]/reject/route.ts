import { filterFetch } from "@/lib/service-client";

// POST /api/filter/hitl/[logId]/reject → proxy to POST /filter/hitl/:logId/reject
export async function POST(_request: Request, { params }: { params: Promise<{ logId: string }> }) {
  const { logId } = await params;
  return filterFetch(`/filter/hitl/${logId}/reject`, {
    method: "POST",
    passThroughErrors: false,
    logMessage: "Failed to proxy HITL reject request",
    logContext: { logId },
  });
}
