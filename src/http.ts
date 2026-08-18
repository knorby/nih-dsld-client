import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "./constants";
import { DsldApiError, DsldNetworkError, DsldTimeoutError } from "./errors";
import { buildQueryString, mergeParams } from "./utils/serialize";

/**
 * A `fetch`-compatible function. The DSLD client uses the standard Web
 * `fetch` (native in Node 18+, React Native, browsers, Bun, and Deno) and
 * accepts an override for polyfills, testing, or request interception.
 */
export type FetchLike = typeof globalThis.fetch;

/** Configuration accepted by {@link DsldClient}. */
export interface DsldClientConfig {
  /**
   * Base URL for the DSLD API. Defaults to the production endpoint
   * (`https://api.ods.od.nih.gov/dsld`). Override for testing or a proxy.
   */
  baseUrl?: string;
  /**
   * Optional data.gov API key. When set, it is appended as the `api_key`
   * query parameter on every request, raising the rate limit from 1,000 to
   * 10,000 requests/hour. Obtain one at
   * https://api.data.gov/docs/developer/.
   *
   * @note The client follows the data.gov convention (`?api_key=…`). If the
   *   DSLD API expects the key differently, use {@link headers} instead.
   */
  apiKey?: string;
  /**
   * Per-request timeout in milliseconds. Requests that exceed this are
   * aborted via `AbortSignal` and reject with a {@link DsldTimeoutError}.
   * @default 30000
   */
  timeoutMs?: number;
  /**
   * Custom `fetch` implementation. Inject a polyfill in older runtimes, a
   * `vi.fn`/mock in tests, or a wrapper that adds auth/telemetry.
   */
  fetch?: FetchLike;
  /**
   * Extra headers merged into every request (e.g. `User-Agent`,
   * `X-Api-Key`). Keys are case-insensitive per the `Headers` spec.
   */
  headers?: Record<string, string>;
  /**
   * Default `User-Agent` header. Some servers/proxies require one. Defaults
   * to `@knorby/nih-dsld-client/<version>`; the version is resolved at
   * build time when available.
   */
  userAgent?: string;
}

/** Package version, injected at build time by tsup's `define` config. */
declare const PKG_VERSION: string | undefined;

const CLIENT_USER_AGENT = `@knorby/nih-dsld-client/${typeof PKG_VERSION !== "undefined" ? PKG_VERSION : "0.0.0"}`;

/**
 * Low-level DSLD HTTP requester. Holds shared config and exposes a single
 * `get` method that builds the URL, applies the timeout, performs the
 * `fetch`, and maps failures to typed errors.
 */
export class DsldRequester {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchLike;
  private readonly headers: Record<string, string>;
  private readonly userAgent: string;

  constructor(config: DsldClientConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetch ?? globalThis.fetch;
    this.userAgent = config.userAgent ?? CLIENT_USER_AGENT;
    this.headers = { ...config.headers };
  }

  /**
   * Performs a `GET` request and returns the parsed JSON body.
   *
   * @param path Path under the base URL (e.g. `"v9/label/25"` or `"version"`).
   * @param params Query parameters (serialized by {@link buildQueryString}).
   * @throws {DsldTimeoutError} when the request exceeds `timeoutMs`.
   * @throws {DsldApiError} for any non-2xx response.
   * @throws {DsldNetworkError} for a transport-level failure.
   */
  async get<TR>(path: string, params?: object): Promise<TR> {
    const url = this.buildUrl(path, params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(url, {
        method: "GET",
        headers: this.buildHeaders(),
        signal: controller.signal,
      });
      return (await this.parseBody(response, url)) as TR;
    } catch (err) {
      if (controller.signal.aborted && !(err instanceof DsldApiError)) {
        throw new DsldTimeoutError(this.timeoutMs);
      }
      if (err instanceof DsldApiError) throw err;
      throw new DsldNetworkError(url, err);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string, params?: object): string {
    const cleanPath = path.replace(/^\/+/, "");
    const base = `${this.baseUrl}/${cleanPath}`;
    const allParams = mergeParams(
      params,
      this.apiKey ? { api_key: this.apiKey } : {},
    );
    const qs = buildQueryString(allParams);
    return qs ? `${base}?${qs}` : base;
  }

  private buildHeaders(): Headers {
    const headers = new Headers(this.headers);
    headers.set("Accept", "application/json");
    if (!headers.has("User-Agent")) {
      headers.set("User-Agent", this.userAgent);
    }
    return headers;
  }

  private async parseBody(response: Response, url: string): Promise<unknown> {
    const bodyText = await response.text();
    if (!response.ok) {
      const retryAfterSeconds = this.parseRetryAfter(
        response.headers.get("Retry-After"),
      );
      throw new DsldApiError({
        status: response.status,
        body: bodyText,
        retryAfterSeconds,
        url,
      });
    }
    if (bodyText === "") return null;
    try {
      return JSON.parse(bodyText);
    } catch {
      // Non-JSON 2xx body — return as-is rather than throw.
      return bodyText;
    }
  }

  private parseRetryAfter(value: string | null): number | undefined {
    if (value === null) return undefined;
    // Numeric form: seconds.
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber >= 0) return asNumber;
    // HTTP-date form: compute seconds from now.
    const date = Date.parse(value);
    if (Number.isNaN(date)) return undefined;
    return Math.max(0, Math.round((date - Date.now()) / 1000));
  }
}
