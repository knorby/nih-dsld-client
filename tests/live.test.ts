/**
 * Live smoke tests against the real NIH DSLD v9 API.
 *
 * Skipped unless `DSLD_LIVE_TESTS=1` is set, to avoid hitting the network
 * (and the 1,000 req/hr rate limit) during normal `npm test` runs. Run with:
 *
 *   DSLD_LIVE_TESTS=1 npx vitest run tests/live.test.ts
 *
 * These tests use tiny `size` values to stay well within rate limits and
 * validate that the client wiring matches the current live API shape.
 */
import { describe, expect, it } from "vitest";
import { DsldClient } from "../src/index";

const RUN_LIVE = process.env.DSLD_LIVE_TESTS === "1";
const itLive = RUN_LIVE ? it : it.skip;

const client = new DsldClient();

describe("live: version", () => {
  itLive("get() returns API version metadata", async () => {
    const info = await client.version.get();
    expect(info.title).toBe("DSLD API");
    expect(info.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("live: label", () => {
  itLive("get(id) returns a full label", async () => {
    const label = await client.label.get(82118);
    expect(label.id).toBe(82118);
    expect(typeof label.fullName).toBe("string");
  });
});

describe("live: brands", () => {
  itLive("browse(by_letter, A) returns brand hits", async () => {
    const res = await client.brands.browse({
      method: "by_letter",
      q: "A",
      size: 1,
    });
    expect(res.hits?.length).toBe(1);
    expect(res.total?.value).toBeGreaterThan(0);
  });
});

describe("live: products", () => {
  itLive("browse(by_keyword, Vitamin D) returns product hits", async () => {
    const res = await client.products.browse({
      method: "by_keyword",
      q: "Vitamin D",
      size: 1,
    });
    expect(res.hits?.length).toBe(1);
  });
});

describe("live: ingredients", () => {
  itLive("groups(by_letter, Z) returns ingredient-group hits", async () => {
    const res = await client.ingredients.groups({
      method: "by_letter",
      term: "Z",
      size: 1,
    });
    expect(res.hits?.length).toBe(1);
  });
});

describe("live: search", () => {
  itLive("labels(q=Strontium) returns search hits", async () => {
    const res = await client.search.labels({ q: "Strontium", size: 1 });
    expect(res.hits?.length).toBe(1);
    expect(res.hits?.[0]?._source?.allIngredients).toBeInstanceOf(Array);
  });

  itLive("histogram(q=Strontium) returns yearly buckets", async () => {
    const res = await client.search.histogram({ q: "Strontium" });
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    expect(res[0]?.doc_count).toBeGreaterThan(0);
  });

  itLive("byBarcode returns results for a known UPC", async () => {
    const res = await client.search.byBarcode("80004843", { size: 1 });
    expect(res.hits?.length).toBeGreaterThan(0);
  });

  itLive("byBarcode finds spaced upcSku from a digits-only scan", async () => {
    // DSLD stores this UPC as "0 33674 13941 7"; a digits-only quoted
    // query alone returns zero hits, so this exercises the variant probing.
    const res = await client.search.byBarcode("033674139417");
    expect(res.hits?.length).toBeGreaterThan(0);
    expect(typeof res.hits?.[0]?._source?.fullName).toBe("string");
  });
});
