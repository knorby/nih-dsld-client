# ADR-0002: Search Surface Ergonomics (Barcode Probing, Defaulted q, labelsAll, codeFor)

- **Status:** Accepted
- **Date:** 2026-08-17

## Context

Feedback from a downstream consumer that built an integration on this client
surfaced four gaps in the search surface:

1. **`byBarcode` missed spaced UPCs.** DSLD stores `upcSku` inconsistently —
   some records carry the human-readable spacing shown on the package
   (`"0 33674 13941 7"`), others are digits-only (`"80004843"`). The
   `search-filter` `q` exact-phrase match is token-based, so a digits-only
   quoted query cannot match a spaced `upcSku` and vice versa. A digits-only
   scan of a spaced UPC returned zero hits (verified against the live API).
   The consumer worked around it with a loose `q` term search plus
   client-side UPC filtering.
2. **`SearchResult` has no `total`**, so consumers had to re-implement
   end-of-results detection (short-page) to paginate `search-filter`.
3. **`q` was required by the type** even for pure fielded searches, forcing
   callers to know the server's `"*"` convention.
4. **No reverse lookup for code enums** — mapping a friendly term
   (`"softgel"`) back to a code was duplicated in every consumer.

Additionally, `HTTP_TOO_MANY_REQUESTS` / `HTTP_BAD_INPUT` existed in
`constants.ts` but were not re-exported from the package root.

## Decision

### `byBarcode` probes UPC representations

`byBarcode` builds a deduplicated candidate list — input as-passed, then
whitespace/hyphen-stripped, then the canonical GS1 grouping re-inserted
(1-5-5-1 for 12-digit UPC-A, 1-5-6-1 for 13-digit EAN) — and issues one
quoted exact-match query per candidate, stopping at the first result with
hits. When nothing matches, the as-passed query's (empty) result is returned
so the response shape stays predictable.

- **Rejected: loose `q` fallback + client-side UPC filter.** Costs the same
  extra requests but cannot verify matches — the live `search-filter`
  `_source` omits `upcSku` entirely, so consumers cannot confirm a hit is
  actually the scanned product.
- **Rejected: wildcard/regex queries.** Not documented for this API.
- Worst case is 3 requests (all variants miss); typical is 1–2. Barcode
  lookups are low-volume, so this is acceptable against the 1,000/hr
  anonymous rate limit.

### `q` defaults to `"*"`

`SearchFilters.q` became optional; `labels()` and `histogram()` send `q=*`
when it is omitted. Verified against the live API that `q=*&<filters>` is a
valid term-less search.

- **Rejected: discriminated union** (`q` required only when no other filter
  is present) — significant type complexity for no runtime benefit, and the
  union would still have to permit `q`-only calls.

### `labelsAll` paginates via short-page detection

`search.labelsAll(filters, size?)` mirrors the existing `*All` generators.
The existing `paginate()` helper already handled `total`-less results via
short-page detection (at most one extra request past the final page), so
`labelsAll` is a thin wrapper; `paginate()`'s docs now state this so adapter
authors can reuse it for `total`-less endpoints.

### `codeFor(map, term)` reverse lookup

A single exported generic helper over the const description maps, matching
in priority order (case-insensitive, trimmed): exact code (key) → exact
description → substring of description. Returns `undefined` on no match.
Named per-enum helpers (`formCodeFor`, …) were rejected as needless API
surface; `codeFor(SUPPLEMENT_FORM_CODES, "softgel")` reads equally well.

### Constants re-exported

`HTTP_TOO_MANY_REQUESTS` (429) and `HTTP_BAD_INPUT` (500 — DSLD documents
`500`, not `400`, for bad input) are re-exported from the package root.

## Consequences

- `byBarcode` may issue up to 3 requests per call (previously 1). Callers on
  strict rate budgets can pre-normalize input or call `labels()` directly
  with `wrapBarcode`/`barcodeVariants` (both exported).
- `barcodeVariants` and `wrapBarcode` are exported for consumers that want
  full control over probing.
- Making `q` optional is backward-compatible at the type level (existing
  calls with `q` still compile).
- `codeFor` substring matching returns the first map-order hit; ambiguous
  terms (e.g. `"capsules"` matching both "Capsules" and "Softgel Capsules")
  resolve to the exact-description match first, then declaration order.
