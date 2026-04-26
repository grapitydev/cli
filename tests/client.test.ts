import { test, expect, describe, beforeEach, afterAll, beforeAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";

// Isolate config reads from the developer's real ~/.grapity/config.yaml.
// The default config (no file) points to http://localhost:3750, which is what
// getRegistryUrl() will return and what we assert on in URL checks.
const tmpHome = mkdtempSync(join(tmpdir(), "grapity-client-test-"));
const originalHome = process.env.HOME;

beforeAll(() => {
  process.env.HOME = tmpHome;
  // Write a predictable local config
  const dir = join(tmpHome, ".grapity");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.yaml"), yaml.dump({ mode: "local", local: { port: 3750 } }), "utf-8");
});

afterAll(() => {
  process.env.HOME = originalHome;
  rmSync(tmpHome, { recursive: true, force: true });
});

import { client } from "../src/client";

type FetchCall = { url: string; method: string; body?: unknown; headers: Record<string, string> };

let lastCall: FetchCall;

function mockFetch(status: number, responseBody: unknown) {
  global.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    let parsedBody: unknown;
    if (init?.body && typeof init.body === "string") {
      try { parsedBody = JSON.parse(init.body); } catch { parsedBody = init.body; }
    }
    lastCall = {
      url,
      method: (init?.method ?? "GET").toUpperCase(),
      body: parsedBody,
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    return new Response(JSON.stringify(responseBody), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  };
}

const BASE = "http://localhost:3750";

describe("client.health", () => {
  test("calls GET /v1/health and returns response", async () => {
    mockFetch(200, { status: "ok", version: "0.0.9", uptime: 42 });
    const result = await client.health();
    expect(lastCall.url).toBe(`${BASE}/v1/health`);
    expect(lastCall.method).toBe("GET");
    expect(result.status).toBe("ok");
  });
});

describe("client.listSpecs", () => {
  test("calls GET /v1/specs and returns empty array", async () => {
    mockFetch(200, []);
    const result = await client.listSpecs();
    expect(lastCall.url).toBe(`${BASE}/v1/specs`);
    expect(lastCall.method).toBe("GET");
    expect(result).toEqual([]);
  });

  test("appends type query param when provided", async () => {
    mockFetch(200, []);
    await client.listSpecs({ type: "openapi" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs?type=openapi`);
  });

  test("appends owner query param when provided", async () => {
    mockFetch(200, []);
    await client.listSpecs({ owner: "platform-team" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs?owner=platform-team`);
  });

  test("appends comma-joined tags query param when provided", async () => {
    mockFetch(200, []);
    await client.listSpecs({ tags: ["billing", "payments"] });
    expect(lastCall.url).toBe(`${BASE}/v1/specs?tags=billing%2Cpayments`);
  });
});

describe("client.getSpec", () => {
  test("calls GET /v1/specs/:name", async () => {
    mockFetch(200, { spec: { name: "payments-api" }, latestVersion: null });
    await client.getSpec("payments-api");
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api`);
    expect(lastCall.method).toBe("GET");
  });

  test("throws with server error message on non-ok response", async () => {
    mockFetch(404, { error: "not_found", message: "Spec not found", statusCode: 404 });
    await expect(client.getSpec("unknown-api")).rejects.toThrow("Spec not found");
  });
});

describe("client.listVersions", () => {
  test("calls GET /v1/specs/:name/versions", async () => {
    mockFetch(200, []);
    await client.listVersions("payments-api");
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions`);
    expect(lastCall.method).toBe("GET");
  });
});

describe("client.getVersion", () => {
  test("calls GET /v1/specs/:name/versions/:semver", async () => {
    mockFetch(200, { version: {} });
    await client.getVersion("payments-api", "1.2.0");
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions/1.2.0`);
  });
});

describe("client.pushSpec", () => {
  test("calls POST /v1/specs with spec content and name in body", async () => {
    mockFetch(201, { spec: {}, version: {}, isNewSpec: true });
    await client.pushSpec({ content: "openapi: 3.1.0", name: "payments-api" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs`);
    expect(lastCall.method).toBe("POST");
    expect((lastCall.body as { name: string }).name).toBe("payments-api");
    expect((lastCall.body as { content: string }).content).toBe("openapi: 3.1.0");
  });

  test("includes force and reason in body when provided", async () => {
    mockFetch(201, { spec: {}, version: {}, isNewSpec: false });
    await client.pushSpec({
      content: "openapi: 3.1.0",
      name: "payments-api",
      force: true,
      reason: "security fix",
    });
    expect((lastCall.body as { force: boolean }).force).toBe(true);
    expect((lastCall.body as { reason: string }).reason).toBe("security fix");
  });

  test("throws with server error message on breaking change (409)", async () => {
    mockFetch(409, {
      error: "breaking_change",
      message: "Breaking changes detected",
      statusCode: 409,
    });
    await expect(
      client.pushSpec({ content: "openapi: 3.1.0", name: "payments-api" })
    ).rejects.toThrow("Breaking changes detected");
  });
});

describe("client.validateSpec", () => {
  test("calls POST /v1/specs/:name/validate with content in body", async () => {
    mockFetch(200, { valid: true });
    await client.validateSpec("payments-api", { content: "openapi: 3.1.0" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/validate`);
    expect(lastCall.method).toBe("POST");
    expect((lastCall.body as { content: string }).content).toBe("openapi: 3.1.0");
  });

  test("returns valid false with errors from server", async () => {
    mockFetch(200, { valid: false, errors: ["Missing info.title"] });
    const result = await client.validateSpec("payments-api", { content: "bad spec" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing info.title");
  });
});

describe("client.getCompatReport", () => {
  test("calls GET /v1/specs/:name/compat/:semver", async () => {
    mockFetch(200, { compatReport: {} });
    await client.getCompatReport("payments-api", "2.0.0");
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/compat/2.0.0`);
  });
});

describe("error handling", () => {
  test("falls back to status code message when server error has no message", async () => {
    mockFetch(500, {});
    await expect(client.health()).rejects.toThrow("Request failed: 500");
  });
});

function mockFetchText(status: number, body: string) {
  global.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    lastCall = {
      url,
      method: (init?.method ?? "GET").toUpperCase(),
      body: undefined,
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    return new Response(body, {
      status,
      headers: { "Content-Type": "text/plain" },
    });
  };
}

describe("client.fetchSpec", () => {
  test("calls GET /v1/specs/:name/spec.yaml for latest, default format", async () => {
    mockFetchText(200, "openapi: 3.1.0");
    await client.fetchSpec("payments-api", { format: "yaml" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/spec.yaml`);
    expect(lastCall.method).toBe("GET");
  });

  test("calls GET /v1/specs/:name/spec.json for latest, json format", async () => {
    mockFetchText(200, '{"openapi":"3.1.0"}');
    await client.fetchSpec("payments-api", { format: "json" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/spec.json`);
  });

  test("calls GET /v1/specs/:name/versions/:semver/spec.yaml for specific version, yaml", async () => {
    mockFetchText(200, "openapi: 3.1.0");
    await client.fetchSpec("payments-api", { version: "1.2.0", format: "yaml" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions/1.2.0/spec.yaml`);
  });

  test("calls GET /v1/specs/:name/versions/:semver/spec.json for specific version, json", async () => {
    mockFetchText(200, '{"openapi":"3.1.0"}');
    await client.fetchSpec("payments-api", { version: "1.2.0", format: "json" });
    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions/1.2.0/spec.json`);
  });

  test("returns raw text body as-is", async () => {
    const raw = "openapi: 3.1.0\ninfo:\n  title: Test";
    mockFetchText(200, raw);
    const result = await client.fetchSpec("payments-api", { format: "yaml" });
    expect(result).toBe(raw);
  });

  test("throws with server error message on 404", async () => {
    mockFetch(404, { error: "not_found", message: "Spec not found", statusCode: 404 });
    await expect(client.fetchSpec("payments-api", { format: "yaml" })).rejects.toThrow("Spec not found");
  });
});
