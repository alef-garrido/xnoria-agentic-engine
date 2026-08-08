import { cognitiveFetch } from "@/lib/service-client";

// POST /api/diagnose/[id]/plan — generate the prioritized action plan for a completed diagnosis
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return cognitiveFetch(`/diagnose/${id}/plan`, {
    method: "POST",
    body: {},
    passThroughErrors: false,
    logMessage: "Failed to generate action plan",
    logContext: { diagnosisId: id },
  });
}
