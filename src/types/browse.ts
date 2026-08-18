import type { Hit, ResultList } from "./common";
import type { LabelEvent, LangualCode, NetContents } from "./label";

/**
 * Truncated serving size returned in summary (`browse-products` /
 * `brand-products`) hits — omits `notes`.
 */
export interface TruncatedServingSize {
  order?: number;
  minQuantity?: number;
  maxQuantity?: number;
  minDailyServings?: number;
  maxDailyServings?: number;
  unit?: string;
  inSFB?: boolean;
}

/**
 * Truncated label returned as the `_source` of `browse-products` and
 * `brand-products` hits. This is a subset of the full {@link Label} — the
 * server omits heavy fields (ingredient rows, statements, contacts, etc.)
 * from list responses.
 *
 * @see https://api.ods.od.nih.gov/dsld/v9/ — `truncatedBrowseProductLabel`
 */
export interface TruncatedLabel {
  servingSizes?: TruncatedServingSize[];
  brandName?: string;
  physicalState?: LangualCode;
  fullName?: string;
  upcSku?: string;
  netContents?: NetContents[];
  events?: LabelEvent[];
  sort?: string[];
  /** Present on some responses; set to the label id. */
  id?: number;
  entryDate?: string;
  offMarket?: number;
  productType?: LangualCode;
}

/**
 * The `_source` of a `browse-brands` hit. The Swagger spec models this as
 * `{ brand: string }`, but live responses return `brandName`. Both are
 * exposed for safety.
 */
export interface BrowseBrandSource {
  brandName?: string;
  brand?: string;
}

/** Result of `GET /v9/browse-brands`. */
export type BrowseBrandsResult = ResultList<BrowseBrandSource>;

/** Result of `GET /v9/browse-products`. */
export type BrowseProductsResult = ResultList<TruncatedLabel>;

/** Result of `GET /v9/brand-products`. */
export type BrandProductsResult = ResultList<TruncatedLabel>;

/** A fact-sheet link attached to an ingredient group. */
export interface IngredientGroupFactsheet {
  link?: string;
  name?: string;
}

/** Nutrient info attached to an ingredient group. */
export interface IngredientGroupNutrientInfo {
  cas?: string;
  identity?: string;
  nutrient?: string;
  iupacNomenclature?: string;
}

/** The `_source` of an `ingredient-groups` hit. */
export interface IngredientGroupDoc {
  /** Ingredient group id. */
  groupId?: string;
  groupName?: string;
  category?: string[];
  synonyms?: string[];
  factsheets?: IngredientGroupFactsheet[];
  nutrientInfo?: IngredientGroupNutrientInfo[];
}

/** A single `ingredient-groups` hit. */
export type IngredientGroupHit = Hit<IngredientGroupDoc>;

/** Result of `GET /v9/ingredient-groups`. */
export type IngredientGroupResult = ResultList<IngredientGroupDoc>;
