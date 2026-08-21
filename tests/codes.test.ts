import { describe, expect, it } from "vitest";
import {
  CLAIM_TYPE_CODES,
  codeFor,
  PRODUCT_TYPE_CODES,
  SUPPLEMENT_FORM_CODES,
  type SupplementFormCode,
} from "../src/types/codes";

describe("codeFor", () => {
  it("matches a description exactly", () => {
    expect(codeFor(SUPPLEMENT_FORM_CODES, "Softgel Capsules")).toBe("e0161");
    expect(codeFor(PRODUCT_TYPE_CODES, "Botanical")).toBe("a1306");
  });

  it("matches a partial term case-insensitively", () => {
    expect(codeFor(SUPPLEMENT_FORM_CODES, "softgel")).toBe("e0161");
    expect(codeFor(SUPPLEMENT_FORM_CODES, "gummies")).toBe("e0176");
    expect(codeFor(SUPPLEMENT_FORM_CODES, "Tablet")).toBe("e0155");
    expect(codeFor(PRODUCT_TYPE_CODES, "BOTANICAL")).toBe("a1306");
  });

  it("matches a raw code (map key)", () => {
    expect(codeFor(CLAIM_TYPE_CODES, "p0265")).toBe("p0265");
    expect(codeFor(SUPPLEMENT_FORM_CODES, "E0161")).toBe("e0161");
  });

  it("prefers an exact description over a substring elsewhere", () => {
    // "Capsules" is a substring of "Softgel Capsules" too, but the exact
    // description "Capsules" must win.
    expect(codeFor(SUPPLEMENT_FORM_CODES, "capsules")).toBe("e0159");
  });

  it("trims the input term", () => {
    expect(codeFor(SUPPLEMENT_FORM_CODES, "  softgel  ")).toBe("e0161");
  });

  it("returns undefined for unknown or blank terms", () => {
    expect(codeFor(SUPPLEMENT_FORM_CODES, "injection")).toBeUndefined();
    expect(codeFor(SUPPLEMENT_FORM_CODES, "   ")).toBeUndefined();
    expect(codeFor(CLAIM_TYPE_CODES, "")).toBeUndefined();
  });

  it("is typed as the map's literal key union", () => {
    const code: SupplementFormCode | undefined = codeFor(
      SUPPLEMENT_FORM_CODES,
      "lozenge",
    );
    expect(code).toBe("e0174");
  });
});
