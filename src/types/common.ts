import type { BrowseMethod } from "./codes";

/**
 * Pagination parameters shared by the four list endpoints
 * (`brand-products`, `browse-brands`, `browse-products`, `ingredient-groups`).
 */
export interface PaginationParams {
  /** Number of the start record for pagination. @default 0 */
  from?: number;
  /**
   * Number of records to return, starting at `from`. The server caps this at
   * 1000; larger values are silently clamped. @default 1000
   */
  size?: number;
}

/**
 * Generic Elasticsearch "hit" envelope returned by every list/search
 * endpoint. The `_source` payload shape varies by endpoint and is supplied
 * as the type parameter `TSource`.
 */
export interface Hit<TSource> {
  /** Elasticsearch index used. */
  _index?: string;
  /** Document type; expected to be `"_doc"`. */
  _type?: string;
  /** Unique id (maps to the DSLD label id or ingredient-group id). */
  _id?: string;
  /** Elasticsearch match score, or `null`. */
  _score?: number | null;
  /** The document payload. */
  _source?: TSource;
  /** Sort values (present on `browse-*` endpoints, used for cursoring). */
  sort?: string[];
}

/**
 * `total` object returned by the list endpoints. `relation` is `"eq"` when
 * the count is exact, or `"gte"` when it is a lower bound (the server stops
 * counting at 10,000).
 */
export interface SearchTotal {
  /** Approximate or exact total number of matching documents. */
  value?: number;
  /**
   * `"eq"` — `value` is exact; `"gte"` — `value` is a lower bound of the
   * total (Elasticsearch caps accurate counting at 10,000).
   */
  relation?: "eq" | "gte";
}

/**
 * Generic paginated result envelope returned by the four list endpoints:
 * a `total`, a `max_score`, and an array of `hits`.
 */
export interface ResultList<TSource> {
  total?: SearchTotal;
  /** Maximum Elasticsearch match score across the returned hits. */
  max_score?: number | null;
  hits?: Hit<TSource>[];
}

/**
 * Per-bucket stat returned in the `stats` object of `search-filter`
 * responses (the stat key is the filter facet name).
 */
export interface FacetStat {
  /** Document count for this facet bucket. */
  count?: number;
  /** Percentage of the overall result set (0–1, e.g. `0.62` = 62%). */
  pct?: number;
}

/**
 * Common query parameters shared by the browse endpoints that take a
 * `method` and a query term.
 */
export interface BrowseQuery {
  /** Specifies the search method. */
  method: BrowseMethod;
  /**
   * Query term. For `by_letter`, a single letter or `"Other"` (to list names
   * beginning with a digit). Optional for some methods but required by the
   * API in practice.
   */
  q?: string;
}
