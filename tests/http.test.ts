import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("DsldRequester — build-time version", () => {
  it("uses PKG_VERSION in the default User-Agent when tsup defines it", async () => {
    // tsup replaces `PKG_VERSION` at build time; in source runs the identifier
    // resolves through the global scope, so a stub exercises the defined arm.
    vi.resetModules();
    vi.stubGlobal("PKG_VERSION", "9.8.7");
    const { DsldRequester: FreshRequester } = await import("../src/http");

    const calls: RequestInit[] = [];
    const requester = new FreshRequester({
      baseUrl: "https://example.test/dsld",
      fetch: async (_url, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({}), { status: 200 });
      },
    });
    await requester.get("version");

    const headers = new Headers(calls[0]?.headers);
    expect(headers.get("User-Agent")).toBe("@knorby/nih-dsld-client/9.8.7");
  });

  it("falls back to 0.0.0 when PKG_VERSION is not defined", async () => {
    vi.resetModules();
    const { DsldRequester: FreshRequester } = await import("../src/http");

    const calls: RequestInit[] = [];
    const requester = new FreshRequester({
      baseUrl: "https://example.test/dsld",
      fetch: async (_url, init) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({}), { status: 200 });
      },
    });
    await requester.get("version");

    const headers = new Headers(calls[0]?.headers);
    expect(headers.get("User-Agent")).toBe("@knorby/nih-dsld-client/0.0.0");
  });
});
