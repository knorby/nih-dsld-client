import { DEFAULT_PAGE_SIZE } from "../constants";
import type { Hit, ResultList, SearchTotal } from "../types/common";

/** A single query parameter value (after arrays are expanded). */
type Scalar = string | number | boolean;

/**
 * A record of query parameters; values may be scalars or arrays of scalars.
 * Exported as a convenience for callers building params programmatically;
 * the serializer also accepts plain objects.
 */
export type QueryRecord = Record<string, Scalar | Scalar[] | undefined | null>;

/**
 * Builds a URL-encoded query string from a parameter record.
 *
 * - `undefined`/`null` (and empty arrays) are omitted.
 * - Array values are joined with a literal `,` (the DSLD API expects
 *   comma-separated multi-value filters, not repeated params).
 * - Each value is encoded with `encodeURIComponent`, so spaces become `%20`
 *   and quotes become `%22` — matching the encoding the DSLD API guide shows
 *   for barcode searches (e.g. `%220%2033674%2013941%207%22`).
 *
 * @returns The query string without the leading `?` (empty string if no
 *   params).
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    const encoded = encodeValue(value);
    if (encoded === undefined) continue;
    parts.push(`${encodeURIComponent(key)}=${encoded}`);
  }
  return parts.join("&");
}

function encodeValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0) return undefined;
    return value.map((v) => encodeURIComponent(String(v))).join(",");
  }
  return encodeURIComponent(String(value));
}

/**
 * Merges a base params object with extra params (extra wins). Returns a plain
 * record safe to pass to {@link buildQueryString}. Used to fold in the API
 * key and barcode wrappers.
 */
export function mergeParams(
  base: object | undefined,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (base) Object.assign(out, base);
  Object.assign(out, extra);
  return out;
}

/**
 * Internal helper: wraps a barcode for an exact `search-filter` `q` query.
 *
 * The DSLD API guide requires barcodes be wrapped in double quotes and
 * URL-encoded. {@link buildQueryString} handles the encoding; this helper
 * only adds the surrounding quotes so callers can pass the raw scanned
 * string (e.g. `"0 33674 13941 7"`).
 */
export function wrapBarcode(barcode: string): string {
  return `"${barcode}"`;
}

/**
 * Async generator that lazily walks every page of a paginated DSLD endpoint.
 *
 * The four list endpoints (`brand-products`, `browse-brands`,
 * `browse-products`, `ingredient-groups`) page via `from`/`size` and return a
 * {@link ResultList} with a `total`. This helper calls `fetchPage` repeatedly,
 * yielding each {@link Hit} across all pages until exhausted.
 *
 * Stops when: a page returns fewer than `size` hits (last page), or the exact
 * `total` is reached. When `total.relation === "gte"` (Elasticsearch caps
 * accurate counting at 10,000), pagination continues until a short page is
 * returned.
 *
 * @example
 * ```ts
 * for await (const hit of paginate({ fetchPage: (from, size) =>
 *   client.brands.browse({ method: "by_letter", q: "A", from, size }) })) {
 *   console.log(hit._source?.brandName);
 * }
 * ```
 */
export async function* paginate<T>({
  fetchPage,
  size,
}: {
  fetchPage: (from: number, size: number) => Promise<ResultList<T>>;
  size?: number;
}): AsyncGenerator<Hit<T>> {
  const pageSize = size ?? DEFAULT_PAGE_SIZE;
  let from = 0;
  let seen = 0;
  let total: SearchTotal | undefined;

  for (;;) {
    const page = await fetchPage(from, pageSize);
    const hits = page.hits ?? [];
    if (hits.length === 0) return;

    for (const hit of hits) {
      yield hit;
    }

    seen += hits.length;
    if (total === undefined) total = page.total;
    if (
      total !== undefined &&
      total.relation === "eq" &&
      seen >= (total.value ?? 0)
    ) {
      return;
    }
    // Short page ⇒ server has no more.
    if (hits.length < pageSize) return;

    from += pageSize;
    // Hard safety cap to avoid unbounded pagination on malformed totals.
    if (from > 100_000) return;
  }
}
