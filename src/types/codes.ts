/**
 * DSLD v9 code enums.
 *
 * The DSLD `search-filter` and `search-filter-histogram` endpoints accept a
 * large set of coded filter values (product type, ingredient category,
 * target group, supplement form, claim type, market status, sort fields,
 * etc.). Each is exported here as:
 *
 * - a **const description map** (e.g. {@link PRODUCT_TYPE_CODES}) mapping the
 *   literal code → human description, and
 * - a **literal-union type** (e.g. {@link ProductTypeCode}) derived from the
 *   map's keys, so editors autocomplete every valid option and typos are
 *   caught at compile time.
 *
 * Source: https://api.ods.od.nih.gov/dsld/v9/ (search-filter query params)
 */

/**
 * Product type codes accepted by the `product_type` filter.
 *
 * Filters labels by their LanguaL product-type code. Multiple values may be
 * passed (comma-separated by the API).
 */
export const PRODUCT_TYPE_CODES = {
  a1305: "Amino Acid/Protein",
  a1306: "Botanical",
  a1326: "Fiber and Other Nutrients",
  a1310: "Omega 3 and Other Fatty Acids",
  a1302: "Vitamin",
  a1299: "Mineral",
  a1316: "Single Vitamin and Mineral",
  a1315: "Multi-Vitamin and Mineral [MVM]",
  a1317: "Botanicals with Nutrients",
  a1309: "Non-Nutrient/Non-Botanical",
  a1325: "Other Combinations",
} as const;

export type ProductTypeCode = keyof typeof PRODUCT_TYPE_CODES;

/**
 * Ingredient category codes accepted by the `ingredient_category` filter.
 *
 * Note the API documentation annotates `chemical` as "(Non-nutrient/non-
 * botanical)"; the literal value sent to the server is `chemical`.
 */
export const INGREDIENT_CATEGORIES = {
  amino_acid: "Amino Acid",
  animal_part_or_source: "Animal Part or Source",
  blend: "Blend",
  botanical: "Botanical",
  sugars: "Sugars",
  complex_carbohydrate: "Complex Carbohydrate",
  enzyme: "Enzyme",
  fat: "Fat",
  fatty_acid: "Fatty Acid",
  fiber: "Fiber",
  hormone: "Hormone",
  chemical: "Chemical (Non-nutrient/non-botanical)",
  bacteria: "Bacteria",
  protein: "Protein",
  vitamin: "Vitamin",
  mineral: "Mineral",
  other: "Other",
  tbd: "To Be Determined",
} as const;

export type IngredientCategoryCode = keyof typeof INGREDIENT_CATEGORIES;

/**
 * Product target-group codes accepted by the `target_group` filter.
 */
export const TARGET_GROUP_CODES = {
  p0250: "All Adults and Children Four Years and Above",
  p0192: "Children 1 to 4 Years",
  p0266: "Infants",
  p0253: "Pregnant and Lactating",
} as const;

export type TargetGroupCode = keyof typeof TARGET_GROUP_CODES;

/**
 * Product supplement-form codes accepted by the `supplement_form` filter.
 * These mirror the LanguaL physical-state codes used on labels.
 */
export const SUPPLEMENT_FORM_CODES = {
  e0164: "Bars",
  e0159: "Capsules",
  e0161: "Softgel Capsules",
  e0155: "Tablets and Pills",
  e0176: "Gummies and Jellies",
  e0165: "Liquids",
  e0174: "Lozenges",
  e0162: "Powders",
  e0172: "Other (e.g. tea bag)",
  e0177: "Unknown",
} as const;

export type SupplementFormCode = keyof typeof SUPPLEMENT_FORM_CODES;

/**
 * Claim-type codes accepted by the `claim_type` filter.
 */
export const CLAIM_TYPE_CODES = {
  p0065: "Nutrient",
  p0265: "Structure/Function",
  p0124: "Approved Health",
  p0264: "Qualified Health",
  p0115: "All Other",
  p0276: "No Claims",
} as const;

export type ClaimTypeCode = keyof typeof CLAIM_TYPE_CODES;

/**
 * Market status values accepted by the `status` filter.
 *
 * - `0` — off market
 * - `1` — on market
 * - `2` — all (default when omitted)
 */
export const MARKET_STATUS = {
  OFF_MARKET: 0,
  ON_MARKET: 1,
  ALL: 2,
} as const;

export type MarketStatus = (typeof MARKET_STATUS)[keyof typeof MARKET_STATUS];

/**
 * Sort fields accepted by `sort_by`.
 *
 * - `_score` — best match (relevance)
 * - `entryDate` — date the label was entered into DSLD
 * - `fullName.keyword` — product name
 */
export const SORT_BY_FIELDS = {
  SCORE: "_score",
  ENTRY_DATE: "entryDate",
  PRODUCT_NAME: "fullName.keyword",
} as const;

export type SortByField = (typeof SORT_BY_FIELDS)[keyof typeof SORT_BY_FIELDS];

/**
 * Sort order accepted by `sort_order`.
 */
export const SORT_ORDERS = {
  ASCENDING: "asc",
  DESCENDING: "desc",
} as const;

export type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

/**
 * Browse/search method values accepted by the `method` parameter on
 * `/v9/browse-brands`, `/v9/browse-products`, and `/v9/ingredient-groups`.
 *
 * - `by_keyword` — match the query term anywhere in the name
 * - `by_letter` — match names beginning with the (single-letter) query term
 * - `factsheet` — (ingredient-groups only) match the query term against
 *   ingredient-group synonyms; used to look up fact sheets
 *
 * For `by_letter`, pass `"Other"` as the query term to list names beginning
 * with a digit.
 */
export const BROWSE_METHODS = {
  BY_KEYWORD: "by_keyword",
  BY_LETTER: "by_letter",
  FACTSHEET: "factsheet",
} as const;

export type BrowseMethod = (typeof BROWSE_METHODS)[keyof typeof BROWSE_METHODS];

/**
 * Values accepted by the `apply_synonyms` filter.
 *
 * - `Yes` (default) — include synonyms/alternate names in ingredient searches
 * - `No` — match the ingredient name(s) exactly only
 */
export const APPLY_SYNONYMS = {
  YES: "Yes",
  NO: "No",
} as const;

export type ApplySynonyms =
  (typeof APPLY_SYNONYMS)[keyof typeof APPLY_SYNONYMS];
