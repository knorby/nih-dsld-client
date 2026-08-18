/**
 * Default base URL for the NIH DSLD v9 REST API.
 *
 * The DSLD API is published by the NIH Office of Dietary Supplements. All v9
 * endpoints live under the `/dsld` path; e.g. a label lookup resolves to
 * `${DEFAULT_BASE_URL}/v9/label/{id}`.
 *
 * @see https://dsld.od.nih.gov/api-guide
 */
export const DEFAULT_BASE_URL = "https://api.ods.od.nih.gov/dsld" as const;

/**
 * Default per-request timeout in milliseconds (30 seconds).
 *
 * The DSLD API can return large result sets; the official guidance when
 * testing is to lower the `size` parameter. 30s is a generous default that
 * accommodates slow mobile connections while still bounding hung requests.
 */
export const DEFAULT_TIMEOUT_MS = 30_000 as const;

/**
 * Default page size for the four paginated list endpoints
 * (`brand-products`, `browse-brands`, `browse-products`, `ingredient-groups`).
 *
 * The API itself defaults to 1000 records per page when `size` is omitted.
 * The client preserves that default so callers only override it when they
 * want smaller (or larger, up to the server's cap) pages.
 */
export const DEFAULT_PAGE_SIZE = 1000 as const;

/**
 * Maximum page size enforced by the server. Requests above this are silently
 * capped by the API; the client does not clamp automatically so callers can
 * observe the real behavior, but this constant is exported for convenience.
 */
export const MAX_PAGE_SIZE = 1000 as const;

/**
 * HTTP status returned by the DSLD API when a client exceeds its hourly
 * rate limit (1,000 requests/hr per IP, or 10,000/hr with a data.gov API
 * key). A `Retry-After` header (seconds) is typically present.
 */
export const HTTP_TOO_MANY_REQUESTS = 429 as const;

/**
 * HTTP status returned by the DSLD API on a bad input parameter.
 *
 * The Swagger spec lists `500` as the error code for "bad input parameter"
 * (rather than the more conventional `400`). The client maps any non-2xx
 * response to a {@link DsldApiError}; this constant is exported so callers
 * can match against the documented behavior.
 */
export const HTTP_BAD_INPUT = 500 as const;
