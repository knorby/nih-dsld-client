import type {
  ApplySynonyms,
  ClaimTypeCode,
  IngredientCategoryCode,
  MarketStatus,
  ProductTypeCode,
  SortByField,
  SortOrder,
  SupplementFormCode,
  TargetGroupCode,
} from "./codes";
import type { FacetStat, Hit } from "./common";
import type {
  Claim,
  LabelEvent,
  LangualCode,
  NetContents,
  UserGroup,
} from "./label";

/**
 * Filters accepted by `GET /v9/search-filter` and
 * `GET /v9/search-filter-histogram`. Field names match the API query params
 * 1:1.
 *
 * For multi-value filters (`product_type`, `ingredient_name`, `brand`,
 * `target_group`, `supplement_form`, `claim_type`, `label_claim`,
 * `product_name`), pass an array — the client joins values with commas.
 *
 * `q` may be omitted for a pure fielded search — the client sends `"*"`
 * (match-anything) on your behalf. To search by barcode, prefer
 * {@link DsldClient.search.byBarcode} which handles the required
 * quoting/encoding and UPC spacing variants.
 */
export interface SearchFilters {
  /**
   * Query term; searches across all label fields. Use quotes for exact
   * multi-token matches. Omit for a term-less (filter-only) search — the
   * client sends `"*"` automatically. (An explicit empty string is not
   * valid; use `undefined`.)
   */
  q?: string;
  /** Field to sort on. */
  sort_by?: SortByField;
  /** Sort direction. */
  sort_order?: SortOrder;
  /** Market status filter. */
  status?: MarketStatus;
  /** Entry-date start year (4-digit `YYYY`, e.g. `2020`). */
  date_start?: number | string;
  /** Entry-date end year (4-digit `YYYY`, e.g. `2020`). */
  date_end?: number | string;
  /** Product name(s) to match (token must appear in product name). */
  product_name?: string | string[];
  /** Product-type code(s). */
  product_type?: ProductTypeCode | ProductTypeCode[];
  /** Ingredient name(s) to match (or that are synonymous with the term). */
  ingredient_name?: string | string[];
  /** Whether to include synonyms/alternate names for ingredients. @default "Yes" */
  apply_synonyms?: ApplySynonyms;
  /** Ingredient-category code(s). */
  ingredient_category?: IngredientCategoryCode | IngredientCategoryCode[];
  /** Brand name(s) to match. */
  brand?: string | string[];
  /** Target-group code(s). */
  target_group?: TargetGroupCode | TargetGroupCode[];
  /** Supplement-form code(s). */
  supplement_form?: SupplementFormCode | SupplementFormCode[];
  /** Claim-type code(s). */
  claim_type?: ClaimTypeCode | ClaimTypeCode[];
  /** Dietary claim(s) to match (term must appear in claim). */
  label_claim?: string | string[];
  /** Pagination offset (undocumented but respected). @default 0 */
  from?: number;
  /** Page size (undocumented but respected). @default 1000 */
  size?: number;
}

/**
 * A flattened ingredient entry returned in `search-filter` `_source.allIngredients`.
 */
export interface SearchIngredient {
  ingredientGroup?: string;
  notes?: string;
  name?: string;
  category?: string;
}

/**
 * The `_source` of a `search-filter` hit. A summary of a label including
 * brand, product type, net contents, claims, events, user groups, and a
 * flattened ingredients list. All fields optional — the API may omit any.
 */
export interface SearchLabelSource {
  id?: number;
  fullName?: string;
  brandName?: string;
  upcSku?: string;
  physicalState?: LangualCode;
  productType?: LangualCode;
  netContents?: NetContents[];
  events?: LabelEvent[];
  claims?: Claim[];
  userGroups?: UserGroup[];
  allIngredients?: SearchIngredient[];
  entryDate?: string;
  offMarket?: number;
}

/** A single `search-filter` hit. */
export type SearchResultHit = Hit<SearchLabelSource>;

/**
 * Result of `GET /v9/search-filter`. Note: this endpoint returns no `total`
 * object — use the `stats` map for per-facet counts and percentages, and
 * {@link DsldClient.search.labelsAll} to iterate all pages without manual
 * short-page bookkeeping.
 */
export interface SearchResult {
  hits?: SearchResultHit[];
  /** Per-facet statistics keyed by facet name (e.g. `count`, `pct`). */
  stats?: Record<string, FacetStat>;
}

/** A single histogram bucket (one year of entry dates). */
export interface HistogramEntry {
  /** ISO date string for the bucket start (e.g. `"2016-01-01T00:00:00.000Z"`). */
  key_as_string?: string;
  /** Elasticsearch epoch-millis encoding of the bucket date. */
  key?: number;
  /** Number of labels added to DSLD in this bucket's year. */
  doc_count?: number;
}

/** Result of `GET /v9/search-filter-histogram`. */
export type SearchHistogramResult = HistogramEntry[];
