// @knorby/nih-dsld-client — TypeScript client for the NIH DSLD v9 REST API.
// Universal: Node, React Native, browsers, Bun, Deno. Zero runtime deps.

export type {
  BrandProductsParams,
  BrandsNamespace,
  BrowseParams,
  IngredientGroupsParams,
  IngredientsNamespace,
  LabelNamespace,
  ProductsNamespace,
  SearchNamespace,
  VersionNamespace,
} from "./client";
export { DsldClient } from "./client";
// Constants for direct reference.
export {
  DEFAULT_BASE_URL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TIMEOUT_MS,
  HTTP_BAD_INPUT,
  HTTP_TOO_MANY_REQUESTS,
  MAX_PAGE_SIZE,
} from "./constants";

export {
  DsldApiError,
  DsldError,
  DsldNetworkError,
  DsldTimeoutError,
} from "./errors";
export type { DsldClientConfig, FetchLike } from "./http";
export type {
  BrandProductsResult,
  BrowseBrandSource,
  BrowseBrandsResult,
  BrowseProductsResult,
  IngredientGroupDoc,
  IngredientGroupFactsheet,
  IngredientGroupHit,
  IngredientGroupNutrientInfo,
  IngredientGroupResult,
  TruncatedLabel,
  TruncatedServingSize,
} from "./types/browse";
export type {
  ApplySynonyms,
  BrowseMethod,
  ClaimTypeCode,
  IngredientCategoryCode,
  MarketStatus,
  ProductTypeCode,
  SortByField,
  SortOrder,
  SupplementFormCode,
  TargetGroupCode,
} from "./types/codes";
// Code enums: const maps + derived literal-union types.
export {
  APPLY_SYNONYMS,
  BROWSE_METHODS,
  CLAIM_TYPE_CODES,
  codeFor,
  INGREDIENT_CATEGORIES,
  MARKET_STATUS,
  PRODUCT_TYPE_CODES,
  SORT_BY_FIELDS,
  SORT_ORDERS,
  SUPPLEMENT_FORM_CODES,
  TARGET_GROUP_CODES,
} from "./types/codes";
// Response & shared types.
export type {
  BrowseQuery,
  FacetStat,
  Hit,
  PaginationParams,
  ResultList,
  SearchTotal,
} from "./types/common";
export type {
  Claim,
  Contact,
  ContactDetails,
  DailyValueTargetGroup,
  IngredientForm,
  IngredientQuantity,
  IngredientRow,
  Label,
  LabelEvent,
  LabelRelationship,
  LabelStatement,
  LangualCode,
  NestedIngredientQuantity,
  NestedIngredientRow,
  NetContents,
  OtherIngredient,
  OtherIngredients,
  ServingSize,
  UserGroup,
} from "./types/label";
export type {
  HistogramEntry,
  SearchFilters,
  SearchHistogramResult,
  SearchIngredient,
  SearchLabelSource,
  SearchResult,
  SearchResultHit,
} from "./types/search";
export type { VersionInfo } from "./types/version";
export type { QueryRecord } from "./utils/serialize";
// Utility re-exports for advanced/pagination use.
export { barcodeVariants, paginate, wrapBarcode } from "./utils/serialize";
