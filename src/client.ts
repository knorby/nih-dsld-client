import type { DsldClientConfig } from "./http";
import { DsldRequester } from "./http";
import type {
  BrandProductsResult,
  BrowseBrandSource,
  BrowseBrandsResult,
  BrowseProductsResult,
  IngredientGroupDoc,
  IngredientGroupResult,
  TruncatedLabel,
} from "./types/browse";
import type { BrowseMethod } from "./types/codes";
import type { Hit } from "./types/common";
import type { Label } from "./types/label";
import type {
  SearchFilters,
  SearchHistogramResult,
  SearchResult,
} from "./types/search";
import type { VersionInfo } from "./types/version";
import { paginate, wrapBarcode } from "./utils/serialize";

/** Parameters for {@link DsldClient.products.byBrand}. */
export interface BrandProductsParams {
  /** Brand name for which products are to be listed. */
  q: string;
  /** Start record for pagination. @default 0 */
  from?: number;
  /** Page size (server caps at 1000). @default 1000 */
  size?: number;
}

/** Parameters for {@link DsldClient.brands.browse} and `products.browse`. */
export interface BrowseParams {
  /** Search method. */
  method: BrowseMethod;
  /**
   * Query term; single letter, keyword, or `"Other"` (names beginning with a
   * digit). Optional for `factsheet` on ingredient-groups.
   */
  q?: string;
  /** Start record for pagination. @default 0 */
  from?: number;
  /** Page size (server caps at 1000). @default 1000 */
  size?: number;
}

/** Parameters for {@link DsldClient.ingredients.groups}. */
export interface IngredientGroupsParams {
  /** Query term: a single letter or `"Other"` (or a keyword for factsheet). */
  term: string;
  /** Search method. `factsheet` matches against ingredient-group synonyms. */
  method: BrowseMethod;
  /** Start record for pagination. @default 0 */
  from?: number;
  /** Page size (server caps at 1000). @default 1000 */
  size?: number;
}

/**
 * A fully-typed, zero-dependency TypeScript client for the NIH Dietary
 * Supplement Label Database (DSLD) v9 REST API.
 *
 * Works in any runtime that provides the standard Web `fetch` (Node 18+,
 * React Native, browsers, Bun, Deno). All seven v9 endpoints are exposed as
 * namespaced methods; every coded filter (product type, ingredient category,
 * target group, supplement form, claim type, …) is a literal-union type so
 * the editor surfaces every valid option.
 *
 * @example
 * ```ts
 * import { DsldClient } from "@knorby/nih-dsld-client";
 *
 * const client = new DsldClient({ apiKey: process.env.DSLD_API_KEY });
 * const label = await client.label.get(82118);
 * const results = await client.search.labels({ q: "Vitamin D" });
 * ```
 */
export class DsldClient {
  private readonly requester: DsldRequester;

  /** API version metadata namespace. */
  readonly version: VersionNamespace;
  /** Single-label lookup namespace. */
  readonly label: LabelNamespace;
  /** Product-listing namespaces. */
  readonly products: ProductsNamespace;
  /** Brand-listing namespace. */
  readonly brands: BrandsNamespace;
  /** Ingredient-group namespace. */
  readonly ingredients: IngredientsNamespace;
  /** Search namespace. */
  readonly search: SearchNamespace;

  constructor(config: DsldClientConfig = {}) {
    this.requester = new DsldRequester(config);
    this.version = new VersionNamespace(this.requester);
    this.label = new LabelNamespace(this.requester);
    this.products = new ProductsNamespace(this.requester);
    this.brands = new BrandsNamespace(this.requester);
    this.ingredients = new IngredientsNamespace(this.requester);
    this.search = new SearchNamespace(this.requester);
  }
}

/** `client.version` — API version metadata. */
export class VersionNamespace {
  constructor(private readonly requester: DsldRequester) {}

  /**
   * Retrieves API version information (`GET /version`).
   *
   * @example
   * ```ts
   * const info = await client.version.get();
   * console.log(info.version); // "9.5.0"
   * ```
   */
  get(): Promise<VersionInfo> {
    return this.requester.get<VersionInfo>("version");
  }
}

/** `client.label` — single-label lookup. */
export class LabelNamespace {
  constructor(private readonly requester: DsldRequester) {}

  /**
   * Retrieves a single label by its DSLD ID (`GET /v9/label/{id}`).
   *
   * @param id The DSLD (label) ID.
   * @example
   * ```ts
   * const label = await client.label.get(82118);
   * ```
   */
  get(id: number): Promise<Label> {
    return this.requester.get<Label>(`v9/label/${id}`);
  }
}

/** `client.products` — product listings. */
export class ProductsNamespace {
  constructor(private readonly requester: DsldRequester) {}

  /**
   * Lists products for a given brand (`GET /v9/brand-products`).
   *
   * @param params.brand `q` — the brand name to list products for (required).
   */
  byBrand(params: BrandProductsParams): Promise<BrandProductsResult> {
    return this.requester.get<BrandProductsResult>("v9/brand-products", params);
  }

  /**
   * Browses products by keyword or letter (`GET /v9/browse-products`).
   *
   * Pass `method: "by_letter"` with a single-letter `q` (or `"Other"` for
   * names starting with a digit), or `method: "by_keyword"` with a search term.
   */
  browse(params: BrowseParams): Promise<BrowseProductsResult> {
    return this.requester.get<BrowseProductsResult>(
      "v9/browse-products",
      params,
    );
  }

  /**
   * Lazily iterates every product hit across all pages of `browse`.
   * Yields {@link Hit} objects (access `_source` for the truncated label).
   *
   * @param params Browse parameters (without `from`/`size`).
   * @param size Page size (default 1000). Pass a smaller value for low-memory runs.
   */
  async *browseAll(
    params: Omit<BrowseParams, "from" | "size">,
    size?: number,
  ): AsyncGenerator<Hit<TruncatedLabel>> {
    yield* paginate<TruncatedLabel>({
      size,
      fetchPage: (from, sz) => this.browse({ ...params, from, size: sz }),
    });
  }
}

/** `client.brands` — brand listings. */
export class BrandsNamespace {
  constructor(private readonly requester: DsldRequester) {}

  /**
   * Browses brands by keyword or letter (`GET /v9/browse-brands`).
   */
  browse(params: BrowseParams): Promise<BrowseBrandsResult> {
    return this.requester.get<BrowseBrandsResult>("v9/browse-brands", params);
  }

  /**
   * Lazily iterates every brand hit across all pages of `browse`.
   */
  async *browseAll(
    params: Omit<BrowseParams, "from" | "size">,
    size?: number,
  ): AsyncGenerator<Hit<BrowseBrandSource>> {
    yield* paginate<BrowseBrandSource>({
      size,
      fetchPage: (from, sz) => this.browse({ ...params, from, size: sz }),
    });
  }
}

/** `client.ingredients` — ingredient groups. */
export class IngredientsNamespace {
  constructor(private readonly requester: DsldRequester) {}

  /**
   * Browses ingredient groups by keyword, letter, or factsheet
   * (`GET /v9/ingredient-groups`).
   *
   * - `method: "by_keyword"` — match `term` anywhere in group name
   * - `method: "by_letter"` — match group names starting with the letter
   * - `method: "factsheet"` — match `term` against synonyms; used to look up
   *   fact sheets for an ingredient group
   */
  groups(params: IngredientGroupsParams): Promise<IngredientGroupResult> {
    return this.requester.get<IngredientGroupResult>(
      "v9/ingredient-groups",
      params,
    );
  }

  /**
   * Lazily iterates every ingredient-group hit across all pages of `groups`.
   */
  async *groupsAll(
    params: Omit<IngredientGroupsParams, "from" | "size">,
    size?: number,
  ): AsyncGenerator<Hit<IngredientGroupDoc>> {
    yield* paginate<IngredientGroupDoc>({
      size,
      fetchPage: (from, sz) => this.groups({ ...params, from, size: sz }),
    });
  }
}

/** `client.search` — search-filter + histogram. */
export class SearchNamespace {
  constructor(private readonly requester: DsldRequester) {}

  /**
   * Searches labels matching a complex combination of terms and filters
   * (`GET /v9/search-filter`).
   *
   * `filters.q` is required; use `"*"` for a term-less search. Multi-value
   * filters accept arrays (comma-joined automatically).
   *
   * @example
   * ```ts
   * const res = await client.search.labels({
   *   q: "Vitamin D",
   *   status: 1,
   *   product_type: ["a1302", "a1316"],
   *   sort_by: "entryDate",
   *   sort_order: "desc",
   * });
   * ```
   */
  labels(filters: SearchFilters): Promise<SearchResult> {
    return this.requester.get<SearchResult>("v9/search-filter", filters);
  }

  /**
   * Generates a histogram of labels over time (`GET /v9/search-filter-histogram`),
   * grouped by the year they were added to DSLD. Accepts the same filters as
   * {@link labels}.
   */
  histogram(filters: SearchFilters): Promise<SearchHistogramResult> {
    return this.requester.get<SearchHistogramResult>(
      "v9/search-filter-histogram",
      filters,
    );
  }

  /**
   * Searches labels by barcode / UPC SKU.
   *
   * Convenience wrapper around {@link labels} that wraps the barcode in
   * double quotes (required by the API guide for an exact `upcSku` match) and
   * URL-encodes it. Pass the raw scanned string — e.g. `"0 33674 13941 7"`
   * or `"80004843"`.
   *
   * @param barcode The raw barcode (with or without spaces).
   * @param filters Optional additional filters (must not include `q`).
   */
  byBarcode(
    barcode: string,
    filters?: Omit<SearchFilters, "q">,
  ): Promise<SearchResult> {
    const merged: SearchFilters = { ...filters, q: wrapBarcode(barcode) };
    return this.labels(merged);
  }
}
