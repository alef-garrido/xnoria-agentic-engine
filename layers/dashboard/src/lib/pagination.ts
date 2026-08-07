import type { QueryResult, QueryResultRow } from "pg";

export interface PaginationParams {
  limit: number;
  page: number;
  offset: number;
}

/**
 * Parse `limit`/`page` search params with the original `||` fallback semantics
 * (an explicit `0` falls back to the default).
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 50
): PaginationParams {
  const limit = parseInt(searchParams.get("limit") || String(defaultLimit), 10);
  const page = parseInt(searchParams.get("page") || "1", 10);
  return { limit, page, offset: (page - 1) * limit };
}

/**
 * Run the list + count queries concurrently and shape the standard
 * `{ rows, total, page, hasMore }` pagination envelope.
 */
export async function paginate<T extends QueryResultRow>(
  list: Promise<QueryResult<T>>,
  count: Promise<QueryResult<{ count: string }>>,
  { limit, page, offset }: PaginationParams
): Promise<{ rows: T[]; total: number; page: number; hasMore: boolean }> {
  const [listResult, countResult] = await Promise.all([list, count]);
  const total = parseInt(countResult.rows[0].count, 10);
  return { rows: listResult.rows, total, page, hasMore: offset + limit < total };
}
