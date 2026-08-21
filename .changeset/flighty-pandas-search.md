---
"@knorby/nih-dsld-client": minor
---

Search surface ergonomics, driven by downstream integration feedback:

- **`search.byBarcode` now probes UPC spacing variants.** DSLD stores
  `upcSku` inconsistently (some spaced like `"0 33674 13941 7"`, some
  digits-only), and the API's exact-phrase match is token-based, so a
  digits-only scan could not match a spaced UPC. `byBarcode` now queries the
  input as-passed, then digits-only, then the canonical GS1 grouping,
  stopping at the first hit. `barcodeVariants()` and `wrapBarcode()` are
  exported for manual control.
- **Added `search.labelsAll(filters, size?)`** — an async generator that
  walks every `search-filter` page using short-page detection, since the
  endpoint returns no `total`. The generic `paginate()` helper is documented
  to support `total`-less page fetchers too.
- **`SearchFilters.q` is now optional.** Omitting it sends `q=*` (term-less,
  filter-only search) instead of producing an invalid request. Backward
  compatible at the type level.
- **Added `codeFor(map, term)`** — reverse-lookup for the code enums
  (`codeFor(SUPPLEMENT_FORM_CODES, "softgel")` → `"e0161"`), matching exact
  code, exact description, then substring (case-insensitive).
- **Re-exported `HTTP_TOO_MANY_REQUESTS` (429) and `HTTP_BAD_INPUT` (500)**
  from the package root.
