import { clientLogger } from "@/lib/client-logger";

export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Typed fetch wrapper for dashboard API routes.
 *
 * - Transport failures throw `ApiError` with `status: 0` (and are logged).
 * - HTTP errors throw `ApiError` carrying the parsed error body; the message is
 *   taken from `details.message` → `error` → `HTTP <status>`, matching the
 *   error envelopes of the proxy routes.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    clientLogger.error("Network request failed", { err, path });
    throw new ApiError("Network error", 0);
  }

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = undefined;
    }
    const body = (data ?? {}) as { error?: unknown; details?: { message?: unknown } };
    let message = `HTTP ${res.status}`;
    if (typeof body?.details?.message === "string") message = body.details.message;
    else if (typeof body?.error === "string") message = body.error;
    throw new ApiError(message, res.status, data);
  }

  return (await res.json()) as T;
}
