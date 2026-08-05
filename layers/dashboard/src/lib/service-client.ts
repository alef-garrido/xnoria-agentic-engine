import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const FILTER_URL = process.env.FILTER_URL ?? "http://filter:3000";
const COGNITIVE_MEMORY_URL = process.env.COGNITIVE_MEMORY_URL ?? "http://cognitive:3001";

interface ProxyOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /**
   * GET-style routes surface upstream failures as `{ error, details }` with the
   * upstream status. When false (mutations), the upstream status + body are
   * forwarded verbatim.
   */
  passThroughErrors?: boolean;
  /** Parse the upstream error body as JSON instead of text. */
  detailsAsJson?: boolean;
  logMessage?: string;
  logContext?: Record<string, unknown>;
}

interface ServiceConfig {
  baseUrl: string;
  serviceName: string;
  failMessage: string;
  detailsAsJson?: boolean;
}

async function proxyFetch(
  path: string,
  options: ProxyOptions,
  config: ServiceConfig
): Promise<NextResponse> {
  try {
    const method = options.method ?? "GET";
    const res = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: method === "GET" ? "no-store" : undefined,
    });

    if (options.passThroughErrors !== false && !res.ok) {
      const details =
        config.detailsAsJson || options.detailsAsJson ? await res.json() : await res.text();
      return NextResponse.json(
        { error: `${config.serviceName} error`, details },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    logger.error(
      { error, service: config.serviceName, path, ...options.logContext },
      options.logMessage ?? `Failed to proxy to ${config.serviceName}`
    );
    return NextResponse.json({ error: config.failMessage }, { status: 502 });
  }
}

/** Proxy to the filter service (POST /filter/execute is NOT routed here). */
export function filterFetch(path: string, options: ProxyOptions = {}): Promise<NextResponse> {
  return proxyFetch(path, options, {
    baseUrl: FILTER_URL,
    serviceName: "Filter service",
    failMessage: "Failed to reach filter service",
  });
}

/** Proxy to the cognitive memory service. */
export function memoryFetch(path: string, options: ProxyOptions = {}): Promise<NextResponse> {
  return proxyFetch(path, options, {
    baseUrl: COGNITIVE_MEMORY_URL,
    serviceName: "Memory service",
    failMessage: "Failed to reach memory service",
    detailsAsJson: true,
  });
}

/** Tolerant body read — returns `undefined` for empty or invalid JSON bodies. */
export async function readOptionalJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
