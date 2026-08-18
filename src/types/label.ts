/**
 * Full label model returned by `GET /v9/label/{id}`.
 *
 * Field names are kept 1:1 with the API (snake_case) so they match the
 * official Swagger spec and live responses exactly. Every field the API
 * has ever been observed returning is typed; all except `id` are optional
 * because the API marks them optional in its spec.
 *
 * Source: https://api.ods.od.nih.gov/dsld/v9/ — `Label` model.
 */

/** A LanguaL code + its human description (used for physical state, product type, claims, user groups). */
export interface LangualCode {
  langualCode?: string;
  langualCodeDescription?: string;
}

/** Contact details block embedded in a {@link Contact}. */
export interface ContactDetails {
  src?: string;
  id?: number;
  name?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  phoneNumber?: string;
  email?: string;
  webAddress?: string;
}

/** A contact listed on a label (e.g. manufacturer, distributor, website). */
export interface Contact {
  contactId?: number;
  text?: string;
  /** Contact type tags (e.g. `"Other"`, `"Manufacturer"`). */
  types?: string[];
  contactDetails?: ContactDetails;
}

/** Relationship of this label to another label (e.g. same product, different size). */
export interface LabelRelationship {
  type?: string;
  labelId?: number;
}

/** Net contents entry (e.g. `60 Tablet(s)`). */
export interface NetContents {
  order?: number;
  quantity?: number;
  unit?: string;
  /** Pre-formatted display string (e.g. `"65 Tablet(s)"`). */
  display?: string;
}

/** A statement printed on the label. */
export interface LabelStatement {
  type?: string;
  notes?: string;
}

/** A claim present on the label. */
export interface Claim {
  langualCode?: string;
  langualCodeDescription?: string;
}

/** A dated event in the label's lifecycle (entry date, off-market date, etc.). */
export interface LabelEvent {
  date?: string;
  type?: string;
}

/** A daily-value target group the label's quantities are expressed against. */
export interface UserGroup {
  dailyValueTargetGroupName?: string;
  langualCode?: string;
  langualCodeDescription?: string;
}

/** Serving size definition. */
export interface ServingSize {
  order?: number;
  minQuantity?: number;
  maxQuantity?: number;
  minDailyServings?: number;
  maxDailyServings?: number;
  unit?: string;
  notes?: string;
  /** Whether this serving size is in the Supplement Facts Box. */
  inSFB?: boolean;
}

/** A form of an ingredient (e.g. `"D-Calcium Pantothenate"` for pantothenic acid). */
export interface IngredientForm {
  order?: number;
  ingredientId?: string;
  prefix?: string;
  percent?: number;
  name?: string;
}

/** Daily-value target group entry on an ingredient quantity. */
export interface DailyValueTargetGroup {
  footnote?: string;
  name?: string;
  operator?: string;
  percent?: number;
}

/** Quantity of an ingredient per serving size. */
export interface IngredientQuantity {
  servingSizeOrder?: number;
  servingSizeQuantity?: number;
  operator?: string;
  quantity?: number;
  unit?: string;
  dailyValueTargetGroup?: DailyValueTargetGroup[];
  servingSizeUnit?: string;
}

/** Quantity on a nested (sub-)ingredient row. */
export interface NestedIngredientQuantity {
  servingSizeQuantity?: number;
  operator?: string;
  quantity?: number;
  unit?: string;
  servingSizeOrder?: number;
}

/** A nested (sub-) ingredient row under a parent {@link IngredientRow}. */
export interface NestedIngredientRow {
  quantity?: NestedIngredientQuantity[];
  order?: number;
  ingredientId?: number;
  description?: string;
  notes?: string;
}

/** A row in the Supplement Facts Box (an active ingredient with its quantity). */
export interface IngredientRow {
  order?: number;
  ingredientId?: number;
  description?: string;
  notes?: string;
  quantity?: IngredientQuantity[];
  nestedRows?: NestedIngredientRow[];
  name?: string;
  /** Free-form category from the label (e.g. `"vitamin"`, `"mineral"`). */
  category?: string;
  ingredientGroup?: string;
  uniiCode?: string;
  alternateNames?: string[];
  forms?: IngredientForm[];
}

/** An "other ingredient" (inactive; not in the Supplement Facts Box). */
export interface OtherIngredient {
  order?: number;
  ingredientId?: number;
  name?: string;
  category?: string;
  ingredientGroup?: string;
  uniiCode?: string;
  alternateNames?: string[];
  forms?: IngredientForm[];
}

/** The `otheringredients` block on a label. */
export interface OtherIngredients {
  text?: string;
  ingredients?: OtherIngredient[];
}

/**
 * A full dietary-supplement label, returned by `GET /v9/label/{id}`.
 */
export interface Label {
  src?: string;
  /** DSLD (label) ID. The only required field. */
  id: number;
  nhanesId?: string;
  bundleName?: string;
  fullName?: string;
  brandName?: string;
  brandIpSymbol?: string;
  upcSku?: string;
  productVersionCode?: string;
  pdf?: string;
  thumbnail?: string;
  servingsPerContainer?: string;
  hasOuterCarton?: boolean;
  percentDvFootnote?: string;
  labelRelationships?: LabelRelationship[];
  contacts?: Contact[];
  netContents?: NetContents[];
  physicalState?: LangualCode;
  servingSizes?: ServingSize[];
  /** Target groups named on the label (e.g. `"Adult (18 - 50 Years)"`). */
  targetGroups?: string[];
  productType?: LangualCode;
  statements?: LabelStatement[];
  claims?: Claim[];
  events?: LabelEvent[];
  userGroups?: UserGroup[];
  ingredientRows?: IngredientRow[];
  otheringredients?: OtherIngredients;
  /** `1` when the product is off market, `0` when on market. */
  offMarket?: number;
  entryDate?: string;
}
