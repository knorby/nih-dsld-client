import { describe, expect, it } from "vitest";
import {
  barcodeVariants,
  codeFor,
  DsldApiError,
  DsldClient,
  DsldError,
  DsldNetworkError,
  DsldTimeoutError,
  DEFAULT_BASE_URL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TIMEOUT_MS,
  HTTP_BAD_INPUT,
  HTTP_TOO_MANY_REQUESTS,
  paginate,
  SUPPLEMENT_FORM_CODES,
  wrapBarcode,
} from "../src/index";

describe("index exports", () => {
  it("exports the client class and error taxonomy", () => {
    expect(typeof DsldClient).toBe("function");
    expect(new DsldError("x")).toBeInstanceOf(Error);
    expect(
      new DsldApiError({ status: 500, body: "", url: "https://x.test" }),
    ).toBeInstanceOf(DsldError);
    expect(
      new DsldNetworkError("https://x.test", new Error("x")),
    ).toBeInstanceOf(DsldError);
    expect(new DsldTimeoutError(10)).toBeInstanceOf(DsldError);
  });

  it("re-exports the constants", () => {
    expect(DEFAULT_BASE_URL).toBe("https://api.ods.od.nih.gov/dsld");
    expect(DEFAULT_PAGE_SIZE).toBe(1000);
    expect(DEFAULT_TIMEOUT_MS).toBe(30_000);
    expect(HTTP_TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP_BAD_INPUT).toBe(500);
  });

  it("re-exports the code and barcode helpers", () => {
    expect(codeFor(SUPPLEMENT_FORM_CODES, "softgel")).toBe("e0161");
    expect(barcodeVariants("033674139417")).toEqual([
      "033674139417",
      "0 33674 13941 7",
    ]);
    expect(typeof paginate).toBe("function");
    expect(wrapBarcode("80004843")).toBe('"80004843"');
  });
});
