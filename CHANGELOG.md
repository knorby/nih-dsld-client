# Changelog

## @knorby/nih-dsld-client@0.1.0

### Minor Changes

- Initial release. A fully-typed, zero-dependency TypeScript client for the
  NIH Dietary Supplement Label Database (DSLD) v9 REST API — universal
  (Node 18+, React Native, browsers, Bun, Deno), covering all seven v9
  endpoints.
- Namespaced client surface: `version`, `label`, `products`, `brands`,
  `ingredients`, `search`, with `*All` async-iterator auto-pagination
  (`browseAll`, `groupsAll`, `labelsAll`) for the list endpoints and
  `search-filter`.
- `label.get(id)` returns the full label plus a client-derived
  `thumbnailUrl` pointing at the label's thumbnail JPEG — the API's own
  `thumbnail` field is returned empty.
- `search.byBarcode(barcode, filters?)` handles the required exact-phrase
  quoting and probes UPC spacing variants (as-passed → digits-only →
  GS1-spaced), since DSLD stores `upcSku` inconsistently and the exact-phrase
  match is token-based. `barcodeVariants()` and `wrapBarcode()` are exported
  for manual control. `SearchFilters.q` is optional (the client sends `q=*`
  for term-less, filter-only searches).
- All coded filters (product type, ingredient category, target group,
  supplement form, claim type, market status, sort field/order, browse
  method, apply-synonyms) are exported as const description maps plus
  literal-union types, with `codeFor(map, term)` reverse lookup.
- Typed error taxonomy: `DsldApiError` (with parsed `Retry-After` on 429
  rate-limit responses), `DsldTimeoutError`, `DsldNetworkError`, and the
  common `DsldError` base. The `api_key` query value is redacted from error
  URLs and messages so logging cannot leak a data.gov key.
- `HTTP_TOO_MANY_REQUESTS` (429) and `HTTP_BAD_INPUT` (500 — the DSLD
  Swagger spec documents `500` rather than `400` for bad input) re-exported
  for matching the documented statuses without magic numbers.

<!-- Changesets generates entries below this line. Do not edit manually. -->
