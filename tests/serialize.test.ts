import { describe, expect, it } from "vitest";
import {
  barcodeVariants,
  buildQueryString,
  mergeParams,
  paginate,
  wrapBarcode,
} from "../src/utils/serialize";

describe("buildQueryString", () => {
  it("omits undefined and null", () => {
    expect(buildQueryString({ a: "x", b: undefined, c: null })).toBe("a=x");
  });

  it("joins arrays with a literal comma separator", () => {
    expect(buildQueryString({ product_type: ["a1302", "a1316"] })).toBe(
      "product_type=a1302,a1316",
    );
  });

  it("omits empty arrays", () => {
    expect(buildQueryString({ a: "x", b: [] })).toBe("a=x");
  });

  it("encodes spaces as %20 (not +)", () => {
    expect(buildQueryString({ q: "Vitamin D" })).toBe("q=Vitamin%20D");
  });

  it("encodes quotes as %22 for barcode search", () => {
    expect(buildQueryString({ q: wrapBarcode("0 33674 13941 7") })).toBe(
      "q=%220%2033674%2013941%207%22",
    );
  });

  it("stringifies numbers and booleans", () => {
    expect(buildQueryString({ status: 1, flag: true })).toBe(
      "status=1&flag=true",
    );
  });

  it("returns empty string for an empty record", () => {
    expect(buildQueryString({})).toBe("");
  });
});

describe("wrapBarcode", () => {
  it("wraps the raw barcode in double quotes", () => {
    expect(wrapBarcode("80004843")).toBe('"80004843"');
    expect(wrapBarcode("0 33674 13941 7")).toBe('"0 33674 13941 7"');
  });
});

describe("barcodeVariants", () => {
  it("adds the GS1-spaced form for 12-digit input", () => {
    expect(barcodeVariants("033674139417")).toEqual([
      "033674139417",
      "0 33674 13941 7",
    ]);
  });

  it("adds the digits-only form for spaced input", () => {
    expect(barcodeVariants("0 33674 13941 7")).toEqual([
      "0 33674 13941 7",
      "033674139417",
    ]);
  });

  it("groups 13-digit codes as 1-5-6-1", () => {
    expect(barcodeVariants("5012345678900")).toEqual([
      "5012345678900",
      "5 01234 567890 0",
    ]);
  });

  it("strips hyphens and trims surrounding whitespace", () => {
    expect(barcodeVariants(" 0-33674 13941-7 ")).toEqual([
      "0-33674 13941-7",
      "033674139417",
      "0 33674 13941 7",
    ]);
  });

  it("returns no spaced form for non-12/13-digit codes", () => {
    expect(barcodeVariants("80004843")).toEqual(["80004843"]);
  });

  it("returns an empty list for blank input", () => {
    expect(barcodeVariants("   ")).toEqual([]);
  });
});

describe("mergeParams", () => {
  it("extra wins over base", () => {
    expect(mergeParams({ a: "base", b: "keep" }, { a: "override" })).toEqual({
      a: "override",
      b: "keep",
    });
  });

  it("handles undefined base", () => {
    expect(mergeParams(undefined, { api_key: "k" })).toEqual({
      api_key: "k",
    });
  });
});

describe("paginate", () => {
  it("yields all hits across pages then stops on a short page", async () => {
    const pages = [
      {
        hits: [{ _id: "1" }, { _id: "2" }],
        total: { value: 3, relation: "eq" as const },
      },
      { hits: [{ _id: "3" }] }, // short page ⇒ stop
    ];
    let i = 0;
    const gen = paginate<{ _id: string }>({
      size: 2,
      fetchPage: async () => pages[i++] ?? { hits: [] },
    });
    const ids: string[] = [];
    for await (const hit of gen) ids.push(hit._id ?? "");
    expect(ids).toEqual(["1", "2", "3"]);
  });

  it("stops when an exact total is reached", async () => {
    const pages = [
      {
        hits: [{ _id: "1" }, { _id: "2" }],
        total: { value: 2, relation: "eq" as const },
      },
    ];
    let i = 0;
    const gen = paginate<{ _id: string }>({
      size: 2,
      fetchPage: async () => pages[i++] ?? { hits: [] },
    });
    const ids: string[] = [];
    for await (const hit of gen) ids.push(hit._id ?? "");
    expect(ids).toEqual(["1", "2"]);
  });

  it("continues past a gte (capped) total until a short page", async () => {
    const pages = [
      {
        hits: [{ _id: "1" }, { _id: "2" }],
        total: { value: 10000, relation: "gte" as const },
      },
      { hits: [{ _id: "3" }] },
    ];
    let i = 0;
    const gen = paginate<{ _id: string }>({
      size: 2,
      fetchPage: async () => pages[i++] ?? { hits: [] },
    });
    const ids: string[] = [];
    for await (const hit of gen) ids.push(hit._id ?? "");
    expect(ids).toEqual(["1", "2", "3"]);
  });

  it("stops on an empty first page", async () => {
    const gen = paginate<{ _id: string }>({
      fetchPage: async () => ({ hits: [] }),
    });
    const ids: string[] = [];
    for await (const hit of gen) ids.push(hit._id ?? "");
    expect(ids).toEqual([]);
  });
});
