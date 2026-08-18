import { describe, expect, it } from "vitest";
import {
  barcodeVariants,
  codeFor,
  HTTP_BAD_INPUT,
  HTTP_TOO_MANY_REQUESTS,
  SUPPLEMENT_FORM_CODES,
} from "../src/index";

describe("template", () => {
  it("should pass a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });
});

describe("index exports", () => {
  it("re-exports the HTTP status constants", () => {
    expect(HTTP_TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP_BAD_INPUT).toBe(500);
  });

  it("re-exports the code and barcode helpers", () => {
    expect(codeFor(SUPPLEMENT_FORM_CODES, "softgel")).toBe("e0161");
    expect(barcodeVariants("033674139417")).toEqual([
      "033674139417",
      "0 33674 13941 7",
    ]);
  });
});
