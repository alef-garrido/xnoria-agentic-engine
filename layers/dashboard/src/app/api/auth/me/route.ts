// ==============================================================================
// Exnoria · Dashboard · GET /api/auth/me
// Returns the currently authenticated operator's identity.
// Used by client components to know who is logged in and their role.
// ==============================================================================

import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET() {
  const operator = await validateSession();

  if (!operator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: operator.id,
    handle: operator.handle,
    display_name: operator.display_name,
    role: operator.role,
  });
}
