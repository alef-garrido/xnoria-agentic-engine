import { cognitiveFetch } from "@/lib/service-client";

// GET /api/diagnose/[id] — poll status/result of a diagnosis (proxied)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return cognitiveFetch(`/diagnose/${id}`, {
    logMessage: "Failed to fetch diagnosis status",
    logContext: { diagnosisId: id },
  });
}
