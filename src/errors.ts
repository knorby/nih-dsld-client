/**
 * Base class for every error thrown by the DSLD client.
 *
 * All client errors extend this class, so `instanceof DsldError` is a
 * reliable way to distinguish API failures from unrelated runtime errors.
 */
export class DsldError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DsldError";
    // Restore prototype chain after a super() call with options (TS quirk).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * A timeout error, raised when a request exceeds the configured
 * `timeoutMs` and is aborted via `AbortSignal`.
 */
export class DsldTimeoutError extends DsldError {
  /** The configured timeout in milliseconds. */
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`DSLD request timed out after ${timeoutMs}ms`);
    this.name = "DsldTimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * A non-2xx response from the DSLD API.
 *
 * The DSLD API's documented error code is `500` for "bad input parameter"
 * (see the Swagger spec), and `429` is used when a caller exceeds the hourly
 * rate limit. Any other non-2xx status is also surfaced as this error type.
 *
 * For 429 responses, `retryAfterSeconds` carries the server's recommended
 * back-off (parsed from the `Retry-After` header when present).
 */
export class DsldApiError extends DsldError {
  /** HTTP status code returned by the server. */
  readonly status: number;
  /** Raw response body (string) for debugging. */
  readonly body: string;
  /**
   * Parsed `Retry-After` header value in seconds, when present (typically on
   * `429` responses). `undefined` when the header is absent or unparsable.
   */
  readonly retryAfterSeconds: number | undefined;
  /**
   * The URL that was requested, with the `api_key` query value redacted so
   * logging the error cannot leak the caller's data.gov key.
   */
  readonly url: string;

  constructor(params: {
    status: number;
    body: string;
    retryAfterSeconds?: number;
    url: string;
  }) {
    const retryText =
      params.retryAfterSeconds !== undefined
        ? ` (retry after ${params.retryAfterSeconds}s)`
        : "";
    super(`DSLD API error ${params.status}${retryText} for ${params.url}`);
    this.name = "DsldApiError";
    this.status = params.status;
    this.body = params.body;
    this.retryAfterSeconds = params.retryAfterSeconds;
    this.url = params.url;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Raised when a network-level failure prevents the request from completing
 * (DNS failure, connection reset, etc.). The original error is attached as
 * `cause`.
 */
export class DsldNetworkError extends DsldError {
  /**
   * The URL that was requested, with the `api_key` query value redacted so
   * logging the error cannot leak the caller's data.gov key.
   */
  readonly url: string;

  constructor(url: string, cause: unknown) {
    super(`DSLD network failure for ${url}`, { cause });
    this.name = "DsldNetworkError";
    this.url = url;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
