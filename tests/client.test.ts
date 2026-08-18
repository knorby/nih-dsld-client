import { describe, expect, it, vi } from "vitest";
import { DsldApiError, DsldClient, DsldTimeoutError } from "../src/index";

/** Builds a `fetch` mock that records requested URLs and returns canned JSON. */
function mockFetch(opts: {
  status?: number;
  body?: unknown;
  text?: string;
  headers?: Record<string, string>;
  ignoreSignal?: boolean;
}) {
  const calls: { url: string; init?: RequestInit } = [];
  const fetchFn = vi.fn(async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (!opts.ignoreSignal && init?.signal) {
      const signal = init.signal as AbortSignal;
      if (signal.aborted) {
        throw Object.assign(new Error("aborted"), { name: "AbortError" });
      }
    }
    const status = opts.status ?? 200;
    const text =
      opts.text ?? (opts.body !== undefined ? JSON.stringify(opts.body) : "");
    return new Response(text, {
      status,
      headers: opts.headers,
    }) as unknown as Response;
  });
  return { fetchFn, calls };
}

const BASE = "https://example.test/dsld";

/** Splits a URL into [path, queryMap]. Query order is ignored by the API. */
function splitUrl(url: string): {
  path: string;
  query: Record<string, string>;
} {
  const [path, qs] = url.split("?");
  const query: Record<string, string> = {};
  if (qs) {
    for (const pair of qs.split("&")) {
      const [k, v] = pair.split("=");
      query[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
    }
  }
  return { path: path ?? "", query };
}

describe("DsldClient — URL building", () => {
  it("version.get hits GET /version with no params", async () => {
    const { fetchFn, calls } = mockFetch({ body: { version: "9.5.0" } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const info = await client.version.get();
    expect(info.version).toBe("9.5.0");
    expect(calls[0]?.url).toBe(`${BASE}/version`);
  });

  it("label.get inserts the id into the path", async () => {
    const { fetchFn, calls } = mockFetch({ body: { id: 82118 } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.label.get(82118);
    expect(calls[0]?.url).toBe(`${BASE}/v9/label/82118`);
  });

  it("products.byBrand passes q as a query param", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.products.byBrand({ q: "Health", size: 10 });
    expect(calls[0]?.url).toBe(`${BASE}/v9/brand-products?q=Health&size=10`);
  });

  it("products.browse encodes method and q", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.products.browse({ method: "by_letter", q: "V" });
    expect(calls[0]?.url).toBe(
      `${BASE}/v9/browse-products?method=by_letter&q=V`,
    );
  });

  it("brands.browse builds the browse-brands URL", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.brands.browse({ method: "by_keyword", q: "Health" });
    expect(calls[0]?.url).toBe(
      `${BASE}/v9/browse-brands?method=by_keyword&q=Health`,
    );
  });

  it("ingredients.groups encodes term and method", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.ingredients.groups({ term: "Z", method: "by_letter" });
    expect(calls[0]?.url).toBe(
      `${BASE}/v9/ingredient-groups?term=Z&method=by_letter`,
    );
  });

  it("strips trailing slashes from baseUrl", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({
      baseUrl: "https://example.test/dsld///",
      fetch: fetchFn,
    });
    await client.version.get();
    expect(calls[0]?.url).toBe("https://example.test/dsld/version");
  });
});

describe("DsldClient — search", () => {
  it("joins multi-value filters with commas and encodes spaces as %20", async () => {
    const { fetchFn, calls } = mockFetch({
      body: { hits: [], stats: { count: { count: 0 } } },
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.labels({
      q: "Vitamin D",
      status: 1,
      product_type: ["a1302", "a1316"],
      sort_by: "entryDate",
      sort_order: "desc",
    });
    const { path, query } = splitUrl(calls[0]?.url ?? "");
    expect(path).toBe(`${BASE}/v9/search-filter`);
    expect(query).toEqual({
      q: "Vitamin D",
      status: "1",
      product_type: "a1302,a1316",
      sort_by: "entryDate",
      sort_order: "desc",
    });
  });

  it("byBarcode wraps the barcode in quotes and encodes spaces", async () => {
    const { fetchFn, calls } = mockFetch({
      body: { hits: [{ _id: "1" }] },
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.byBarcode("0 33674 13941 7");
    const { path, query } = splitUrl(calls[0]?.url ?? "");
    expect(path).toBe(`${BASE}/v9/search-filter`);
    expect(query).toEqual({ q: '"0 33674 13941 7"' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("byBarcode merges extra filters alongside the wrapped barcode", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.byBarcode("80004843", { status: 1 });
    const { query } = splitUrl(calls[0]?.url ?? "");
    expect(query).toEqual({ q: '"80004843"', status: "1" });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("defaults q to '*' for term-less filtered searches", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.labels({ status: 1, product_type: "a1302" });
    const { query } = splitUrl(calls[0]?.url ?? "");
    expect(query).toEqual({ q: "*", status: "1", product_type: "a1302" });
  });

  it("preserves an explicit q instead of defaulting", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.labels({ q: "Vitamin D" });
    const { query } = splitUrl(calls[0]?.url ?? "");
    expect(query).toEqual({ q: "Vitamin D" });
  });

  it("histogram also defaults q to '*'", async () => {
    const { fetchFn, calls } = mockFetch({ body: [] });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.histogram({ claim_type: "p0265" });
    const { path, query } = splitUrl(calls[0]?.url ?? "");
    expect(path).toBe(`${BASE}/v9/search-filter-histogram`);
    expect(query).toEqual({ q: "*", claim_type: "p0265" });
  });

  it("histogram hits the histogram endpoint with the same filters", async () => {
    const { fetchFn, calls } = mockFetch({
      body: [
        {
          key_as_string: "2020-01-01T00:00:00.000Z",
          key: 1577836800000,
          doc_count: 1,
        },
      ],
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const res = await client.search.histogram({ q: "Strontium" });
    expect(calls[0]?.url).toBe(
      `${BASE}/v9/search-filter-histogram?q=Strontium`,
    );
    expect(res[0]?.doc_count).toBe(1);
  });
});

describe("DsldClient — byBarcode variants", () => {
  /** Mock fetch returning a different body per call (empty object when exhausted). */
  function sequentialFetch(bodies: unknown[]) {
    let call = 0;
    const fetchFn = vi.fn(async () => {
      const body = bodies[call++] ?? { hits: [] };
      return new Response(JSON.stringify(body), {
        status: 200,
      }) as unknown as Response;
    });
    return { fetchFn };
  }

  it("probes the GS1-spaced form when a digits-only scan finds nothing", async () => {
    const { fetchFn } = sequentialFetch([
      { hits: [] },
      {
        hits: [{ _id: "1", _source: { fullName: "Alive! Women's 50+" } }],
      },
    ]);
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const res = await client.search.byBarcode("033674139417");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const urls = fetchFn.mock.calls.map(([url]) => splitUrl(String(url)));
    expect(urls[0]?.query.q).toBe('"033674139417"');
    expect(urls[1]?.query.q).toBe('"0 33674 13941 7"');
    expect(res.hits?.[0]?._source?.fullName).toBe("Alive! Women's 50+");
  });

  it("stops probing once a variant hits", async () => {
    const { fetchFn } = sequentialFetch([
      { hits: [{ _id: "9", _source: { fullName: "BeWell Daily" } }] },
      { hits: [{ _id: "unexpected" }] },
    ]);
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const res = await client.search.byBarcode("80004843");
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const first = splitUrl(String(fetchFn.mock.calls[0]?.[0]));
    expect(first.query.q).toBe('"80004843"');
    expect(res.hits?.length).toBe(1);
  });

  it("returns the as-passed empty result when no variant matches", async () => {
    const { fetchFn } = sequentialFetch([{ hits: [] }, { hits: [] }]);
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const res = await client.search.byBarcode("0 33674 13941 7");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const urls = fetchFn.mock.calls.map(([url]) => splitUrl(String(url)));
    expect(urls[0]?.query.q).toBe('"0 33674 13941 7"');
    expect(urls[1]?.query.q).toBe('"033674139417"');
    expect(res).toEqual({ hits: [] });
  });

  it("carries extra filters into every probe", async () => {
    const { fetchFn } = sequentialFetch([{ hits: [] }, { hits: [] }]);
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.search.byBarcode("033674139417", { status: 1 });
    const urls = fetchFn.mock.calls.map(([url]) => splitUrl(String(url)));
    expect(urls[0]?.query).toEqual({ q: '"033674139417"', status: "1" });
    expect(urls[1]?.query).toEqual({
      q: '"0 33674 13941 7"',
      status: "1",
    });
  });
});

describe("DsldClient — labelsAll", () => {
  it("yields every hit across pages via short-page detection (no total)", async () => {
    const pages = [
      { hits: [{ _id: "1" }, { _id: "2" }] },
      { hits: [{ _id: "3" }] }, // short page ⇒ stop; note: no `total` field
    ];
    let call = 0;
    const fetchFn = vi.fn(async () => {
      const page = pages[call++] ?? { hits: [] };
      return new Response(JSON.stringify(page), {
        status: 200,
      }) as unknown as Response;
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const ids: string[] = [];
    for await (const hit of client.search.labelsAll({ q: "Vitamin D" }, 2)) {
      ids.push(hit._id ?? "");
    }
    expect(ids).toEqual(["1", "2", "3"]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("defaults q to '*' when omitted", async () => {
    const fetchFn = vi.fn(async () => {
      return new Response(JSON.stringify({ hits: [] }), {
        status: 200,
      }) as unknown as Response;
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const ids: string[] = [];
    for await (const hit of client.search.labelsAll({ status: 1 }, 5)) {
      ids.push(hit._id ?? "");
    }
    expect(ids).toEqual([]);
    const { query } = splitUrl(String(fetchFn.mock.calls[0]?.[0]));
    expect(query.q).toBe("*");
  });
});

describe("DsldClient — api key", () => {
  it("appends api_key to every request", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({
      baseUrl: BASE,
      apiKey: "secret-key",
      fetch: fetchFn,
    });
    await client.brands.browse({ method: "by_letter", q: "A" });
    expect(calls[0]?.url).toBe(
      `${BASE}/v9/browse-brands?method=by_letter&q=A&api_key=secret-key`,
    );
  });
});

describe("DsldClient — pagination", () => {
  it("browseAll yields every hit across pages", async () => {
    let call = 0;
    const pages = [
      {
        total: { value: 3, relation: "eq" as const },
        hits: [
          { _id: "1", _source: { brandName: "A1" } },
          { _id: "2", _source: { brandName: "A2" } },
        ],
      },
      {
        total: { value: 3, relation: "eq" as const },
        hits: [{ _id: "3", _source: { brandName: "A3" } }],
      },
    ];
    const fetchFn = vi.fn(async (url: string | URL) => {
      void url;
      const page = pages[call++] ?? { hits: [] };
      return new Response(JSON.stringify(page), {
        status: 200,
      }) as unknown as Response;
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const names: string[] = [];
    for await (const hit of client.brands.browseAll(
      { method: "by_letter", q: "A" },
      2,
    )) {
      names.push(hit._source?.brandName ?? "");
    }
    expect(names).toEqual(["A1", "A2", "A3"]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

describe("DsldClient — errors", () => {
  it("maps a 500 to a DsldApiError with status and body", async () => {
    const { fetchFn } = mockFetch({
      status: 500,
      text: "bad input parameter",
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    const error = await client.version
      .get()
      .catch((e: unknown) => e as DsldApiError);
    expect(error).toBeInstanceOf(DsldApiError);
    expect(error.status).toBe(500);
    expect(error.body).toBe("bad input parameter");
    expect(error.url).toBe(`${BASE}/version`);
  });

  it("parses Retry-After (seconds) on a 429", async () => {
    const { fetchFn } = mockFetch({
      status: 429,
      text: "rate limited",
      headers: { "Retry-After": "3600" },
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await expect(client.version.get()).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 3600,
    });
  });

  it("parses an HTTP-date Retry-After", async () => {
    const future = new Date(Date.now() + 60_000).toUTCString();
    const { fetchFn } = mockFetch({
      status: 429,
      text: "rate limited",
      headers: { "Retry-After": future },
    });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await expect(client.version.get()).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: expect.any(Number),
    });
  });

  it("raises DsldTimeoutError when the request is aborted", async () => {
    const fetchFn = vi.fn((_url: string | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal;
        signal.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
    });
    const client = new DsldClient({
      baseUrl: BASE,
      fetch: fetchFn,
      timeoutMs: 10,
    });
    await expect(client.version.get()).rejects.toBeInstanceOf(DsldTimeoutError);
  });

  it("sets a default User-Agent header", async () => {
    const { fetchFn, calls } = mockFetch({ body: { hits: [] } });
    const client = new DsldClient({ baseUrl: BASE, fetch: fetchFn });
    await client.version.get();
    const headers = new Headers(calls[0]?.init?.headers);
    expect(headers.get("User-Agent")).toMatch(/^@knorby\/nih-dsld-client\//);
    expect(headers.get("Accept")).toBe("application/json");
  });
});
