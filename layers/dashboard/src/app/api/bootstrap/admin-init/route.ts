// ==============================================================================
// Exnoria · Dashboard · POST /api/bootstrap/admin-init
// Public bootstrap endpoint for initial admin password setup
//
// This endpoint is intentionally public — it's a one-time bootstrap mechanism.
// Once admin password_hash is set (not NULL), this endpoint rejects all
// subsequent calls with 403 Forbidden.
//
// Use Case: If DASHBOARD_ADMIN_PASSWORD was not set in .env before migrations
// ran, or if the env var was added after the stack started, call this endpoint
// to initialize the admin password once during bootstrap.
//
// Security: The check "password_hash IS NULL" is the guard. The first successful
// call makes the endpoint permanently unusable.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/lib/db";
import { logger } from "@/lib/logger";

const BCRYPT_COST = 12;
const MIN_PASSWORD_LENGTH = 8;

/**
 * POST /api/bootstrap/admin-init
 *
 * Public endpoint (no auth required).
 * Initializes admin password one time during setup.
 *
 * Request body: { password: string }
 *
 * Responses:
 *   200 OK — Admin password initialized successfully
 *   400 Bad Request — Password too short or invalid request
 *   403 Forbidden — Admin already initialized or credentials invalid
 *   500 Internal Server Error — Database error
 */
export async function POST(request: NextRequest) {
  let password: string | undefined;

  try {
    const body = await request.json();
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate password provided
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Missing required field: password" }, { status: 400 });
  }

  // Validate password length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    // Check if admin password_hash is NULL (guard against reuse)
    const adminCheck = await query("SELECT id, password_hash FROM operators WHERE handle = $1", [
      "admin",
    ]);

    if (adminCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Admin user not found. This should not happen — check migrations." },
        { status: 403 }
      );
    }

    const adminUser = adminCheck.rows[0];

    // If password_hash is already set, reject the request
    if (adminUser.password_hash !== null) {
      return NextResponse.json(
        {
          error: "Admin already initialized. This endpoint can only be used once during setup.",
        },
        { status: 403 }
      );
    }

    // Hash the password with bcrypt
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // Update admin row with password hash and mark password as changed
    const result = await query(
      "UPDATE operators SET password_hash = $1, password_changed = true WHERE handle = $2 RETURNING id, handle, display_name",
      [passwordHash, "admin"]
    );

    return NextResponse.json(
      {
        message: "Admin password initialized successfully",
        admin: result.rows[0],
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    logger.error({ error: err }, "Bootstrap admin password initialization failed");
    return NextResponse.json(
      { error: "Internal server error during password initialization" },
      { status: 500 }
    );
  }
}
