# @knorby/nih-dsld-client

A fully-typed, zero-dependency TypeScript client for the NIH Dietary Supplement
Label Database (DSLD) v9 REST API. Universal: works in Node, React Native,
browsers, Bun, and Deno — anywhere the standard Web `fetch` is available.

- **Zero runtime dependencies** — built on the standard `fetch`, `Headers`,
  `AbortController`, and `Response` (all global in modern runtimes).
- **Fully typed** — every endpoint, response model, and coded filter
  (product type, ingredient category, target group, supplement form, claim
  type, …) is a literal-union type so your editor surfaces every valid option.
- **Comprehensive** — covers all seven v9 endpoints, plus async-iterator
  auto-pagination and a barcode-search helper.
- **Predictable errors** — typed `DsldApiError` / `DsldTimeoutError` with
  parsed `Retry-After` on rate-limit (429) responses.

DSLD data are in the public domain (CC0 1.0). When using this client, please
credit the source:

> National Institutes of Health, Office of Dietary Supplements. Dietary
> Supplement Label Database, 2026. https://dsld.od.nih.gov/.

## Install

```bash
npm install @knorby/nih-dsld-client
```

## Quick start

```ts
import { DsldClient } from "@knorby/nih-dsld-client";

// No API key needed for up to 1,000 requests/hour per IP.
const client = new DsldClient({
  // apiKey: process.env.DSLD_API_KEY, // raises limit to 10,000/hr
});

// API version metadata
const info = await client.version.get();

// Full label by DSLD ID
const label = await client.label.get(82118);

// Browse brands starting with "A"
const brands = await client.brands.browse({ method: "by_letter", q: "A", size: 10 });

// Search with filters
const results = await client.search.labels({
  q: "Vitamin D",
  status: 1,                       // 1 = on market
  product_type: ["a1302", "a1316"], // Vitamin, Single Vitamin & Mineral
  sort_by: "entryDate",
  sort_order: "desc",
});

// Term-less, filter-only search (q omitted → client sends "*")
const onMarket = await client.search.labels({ status: 1 });

// Look up a label by scanned barcode. Handles quoting/encoding and probes
// UPC spacing variants, so digits-only scans match spaced upcSku values.
const match = await client.search.byBarcode("033674139417");
```

## Universal runtime notes

The client uses the global `fetch` (and `Headers` / `AbortController` /
`Response`), which is native in:

| Runtime    | Available since |
| ---------- | --------------- |
| Node.js    | 18              |
| Browsers   | Evergreen       |
| React Native | 0.73+ (fetch polyfill) |
| Bun / Deno | All             |

For tests or older runtimes, inject a custom `fetch`:

```ts
import { DsldClient } from "@knorby/nih-dsld-client";

const client = new DsldClient({
  fetch: (url, init) => myFetchImpl(url, init),
});
```

## API reference

### `client.version.get(): Promise<VersionInfo>`

`GET /version` — deployed API version metadata.

### `client.label.get(id: number): Promise<Label>`

`GET /v9/label/{id}` — the full label model (ingredients, quantities, claims,
contacts, serving sizes, events, …). The response also includes a
client-derived `thumbnailUrl` (`{baseUrl}/s3/pdf/thumbnails/{id}.jpg`)
pointing at the label's thumbnail JPEG, since the API's own `thumbnail`
field is returned empty. Note the underlying image may 404 for labels
without a stored thumbnail.

```ts
const label = await client.label.get(82118);
label.ingredientRows?.forEach((row) => {
  console.log(row.name, row.quantity?.[0]?.quantity, row.quantity?.[0]?.unit);
});
console.log(label.thumbnailUrl);
// "https://api.ods.od.nih.gov/dsld/s3/pdf/thumbnails/82118.jpg"
```

### `client.products` — product listings

```ts
// GET /v9/brand-products — products for a given brand
await client.products.byBrand({ q: "Health", from: 0, size: 100 });

// GET /v9/browse-products — browse by keyword or letter
await client.products.browse({ method: "by_letter", q: "V" });
await client.products.browse({ method: "by_keyword", q: "Vitamin D" });

// Lazily iterate every product across all pages
for await (const hit of client.products.browseAll({ method: "by_letter", q: "V" })) {
  console.log(hit._source?.fullName);
}
```

### `client.brands` — brand listings

```ts
await client.brands.browse({ method: "by_keyword", q: "Health" });
await client.brands.browse({ method: "by_letter", q: "G" });

for await (const hit of client.brands.browseAll({ method: "by_letter", q: "A" })) {
  console.log(hit._source?.brandName);
}
```

### `client.ingredients` — ingredient groups

```ts
await client.ingredients.groups({ method: "by_keyword", term: "Vitamin D" });
await client.ingredients.groups({ method: "by_letter", term: "Z" });
await client.ingredients.groups({ method: "factsheet", term: "Folic Acid" });

for await (const hit of client.ingredients.groupsAll({ method: "by_letter", term: "Z" })) {
  console.log(hit._source?.groupName);
}
```

### `client.search` — search-filter + histogram

```ts
// GET /v9/search-filter — complex combination of terms & filters
const res = await client.search.labels({
  q: "Strontium",                 // optional; omit for term-less search ("*")
  status: 2,                       // 0 = off market, 1 = on market, 2 = all
  date_start: 2020,
  date_end: 2024,
  product_name: ["Daily Multi"],   // arrays → comma-joined automatically
  product_type: ["a1302", "a1316"],
  ingredient_name: ["Vitamin D"],
  apply_synonyms: "Yes",           // or "No" for exact-only
  ingredient_category: ["vitamin", "mineral"],
  brand: ["Nature's Bounty"],
  target_group: ["p0250"],
  supplement_form: ["e0159", "e0155"],
  claim_type: ["p0065", "p0265"],
  label_claim: ["calcium"],
  sort_by: "entryDate",            // "_score" | "entryDate" | "fullName.keyword"
  sort_order: "desc",              // "asc" | "desc"
});

// Term-less, filter-only search — q defaults to "*"
await client.search.labels({ status: 1, supplement_form: "e0161" });

// GET /v9/search-filter-histogram — yearly buckets of labels added to DSLD
const buckets = await client.search.histogram({ q: "Strontium" });

// Barcode / UPC search. DSLD stores upcSku inconsistently (some records
// spaced like "0 33674 13941 7", some digits-only like "80004843"), and the
// API's exact-phrase match is token-based — one form can't match the other.
// byBarcode quotes + encodes each representation and probes them in order
// (as-passed → digits-only → GS1-spaced) until one returns hits.
await client.search.byBarcode("033674139417", { status: 1 });
```

`search-filter` returns **no `total`**, so end-of-results must be detected by
short pages. `labelsAll` does that bookkeeping for you:

```ts
for await (const hit of client.search.labelsAll({ q: "Vitamin D" }, 500)) {
  console.log(hit._source?.fullName);
}
```

## Code enums

Every coded filter is exported as a **const description map** plus a derived
**literal-union type**, so options are discoverable and typos are caught at
compile time:

```ts
import {
  PRODUCT_TYPE_CODES,
  SUPPLEMENT_FORM_CODES,
  type ProductTypeCode,
} from "@knorby/nih-dsld-client";

console.log(PRODUCT_TYPE_CODES.a1302);        // "Amino Acid/Protein"
const code: ProductTypeCode = "a1302";        // OK
```

### Reverse lookup: `codeFor`

`codeFor` maps a friendly term back to a code — exact code, exact
description, then substring (all case-insensitive):

```ts
import { SUPPLEMENT_FORM_CODES, codeFor } from "@knorby/nih-dsld-client";

codeFor(SUPPLEMENT_FORM_CODES, "e0161");           // "e0161" (exact key)
codeFor(SUPPLEMENT_FORM_CODES, "Softgel Capsules"); // "e0161" (exact description)
codeFor(SUPPLEMENT_FORM_CODES, "softgel");          // "e0161" (substring)
codeFor(SUPPLEMENT_FORM_CODES, "tablet");           // "e0155"
```

Returns the first match in the map's declaration order, or `undefined` when
nothing matches.

| Enum                | Const map                | Type                       |
| ------------------- | ------------------------ | -------------------------- |
| Product type        | `PRODUCT_TYPE_CODES`     | `ProductTypeCode`          |
| Ingredient category | `INGREDIENT_CATEGORIES`  | `IngredientCategoryCode`   |
| Target group        | `TARGET_GROUP_CODES`     | `TargetGroupCode`          |
| Supplement form     | `SUPPLEMENT_FORM_CODES`  | `SupplementFormCode`       |
| Claim type          | `CLAIM_TYPE_CODES`        | `ClaimTypeCode`            |
| Market status       | `MARKET_STATUS`          | `MarketStatus`             |
| Sort field          | `SORT_BY_FIELDS`         | `SortByField`              |
| Sort order          | `SORT_ORDERS`            | `SortOrder`                |
| Browse method       | `BROWSE_METHODS`         | `BrowseMethod`             |
| Apply synonyms      | `APPLY_SYNONYMS`         | `ApplySynonyms`            |

## Configuration

```ts
const client = new DsldClient({
  baseUrl: "https://api.ods.od.nih.gov/dsld", // default
  apiKey: process.env.DSLD_API_KEY,           // appended as ?api_key=...
  timeoutMs: 30_000,                          // per-request timeout (default 30s)
  headers: { "X-Custom": "value" },           // extra headers
  userAgent: "my-app/1.0",                    // default User-Agent override
  fetch: customFetch,                         // inject a fetch impl
});
```

### Rate limits

The DSLD API allows **1,000 requests/hour per IP** without a key, and
**10,000 requests/hour** with a free data.gov API key. Exceeding the limit
returns `429` with a `Retry-After` header, surfaced as
`DsldApiError.retryAfterSeconds`. Obtain a key from the
[data.gov developer network](https://api.data.gov/docs/developer/).

## Error handling

```ts
import {
  DsldApiError,
  DsldTimeoutError,
  DsldError,
  HTTP_BAD_INPUT,
  HTTP_TOO_MANY_REQUESTS,
} from "@knorby/nih-dsld-client";

try {
  await client.label.get(id);
} catch (err) {
  if (err instanceof DsldApiError) {
    console.error(`API ${err.status}`, err.body);
    if (err.status === HTTP_TOO_MANY_REQUESTS) {
      console.log(`retry after ${err.retryAfterSeconds}s`);
    }
  } else if (err instanceof DsldTimeoutError) {
    console.error("timed out", err.timeoutMs);
  } else if (err instanceof DsldError) {
    console.error("other client error", err);
  }
}
```

`HTTP_TOO_MANY_REQUESTS` (`429`) and `HTTP_BAD_INPUT` (`500` — the DSLD
Swagger spec documents `500` rather than `400` for bad input parameters) are
exported for matching these documented statuses without magic numbers.

## Pagination

The four list endpoints (`brand-products`, `browse-brands`, `browse-products`,
`ingredient-groups`) page via `from`/`size` (default 1000/page, server-capped).
Use the `*All` async generators to walk every hit without manual bookkeeping:

```ts
for await (const hit of client.brands.browseAll({ method: "by_letter", q: "A" })) {
  // fetches the next page lazily as you iterate
}

// search-filter pages the same way but returns no `total`; labelsAll
// detects the end of results via short pages.
for await (const hit of client.search.labelsAll({ status: 1 })) {
  // ...
}

// Or paginate manually:
let from = 0;
const size = 100;
const page = await client.brands.browse({ method: "by_letter", q: "A", from, size });
```

The exported `paginate()` helper lets you wrap any page-fetching function
(it also works with `total`-less results, stopping on short pages):

```ts
import { paginate } from "@knorby/nih-dsld-client";

for await (const hit of paginate({
  size: 100,
  fetchPage: (from, size) => client.brands.browse({ method: "by_letter", q: "A", from, size }),
})) {
  // ...
}
```

## Testing

```bash
npm test                    # unit tests (mocked fetch)
npm run test:watch
npm run test:coverage
DSLD_LIVE_TESTS=1 npm test  # opt-in live smoke tests against the real API
```

Unit tests use an injected mock `fetch` — no network access. Live smoke tests
are skipped unless `DSLD_LIVE_TESTS=1` is set and use tiny page sizes to stay
within rate limits.

## Development

| Command | What it does |
| --- | --- |
| `npm run build` | Build (tsup + tsc — dual ESM/CJS with `.d.ts`/`.d.cts`) |
| `npm run dev` | Build in watch mode |
| `npm run lint` | Lint with Biome |
| `npm run check` | Lint + format in one pass (writes changes) |
| `npm run typecheck` | Type-check `src/` + `tests/` |
| `npm test` | Run tests (Vitest) |

See [`AGENTS.md`](AGENTS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md) for the
full development workflow, and [`docs/`](docs/) for architecture notes.

## License

Apache-2.0. DSLD data accessed through this client are public domain (CC0 1.0);
please cite the NIH Office of Dietary Supplements as the source.
