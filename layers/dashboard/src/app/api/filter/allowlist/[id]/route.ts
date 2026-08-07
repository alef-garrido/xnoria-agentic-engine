import { filterFetch } from "@/lib/service-client";

// PATCH /api/filter/allowlist/[id] → proxy to PATCH /filter/allowlist/:id
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return filterFetch(`/filter/allowlist/${id}`, {
    method: "PATCH",
    body,
    passThroughErrors: false,
    logMessage: "Failed to proxy allowlist update",
    logContext: { actionId: id },
  });
}

// DELETE /api/filter/allowlist/[id] → proxy to DELETE /filter/allowlist/:id
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return filterFetch(`/filter/allowlist/${id}`, {
    method: "DELETE",
    passThroughErrors: false,
    logMessage: "Failed to proxy allowlist delete",
    logContext: { actionId: id },
  });
}
