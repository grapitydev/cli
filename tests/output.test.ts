import { test, expect, describe } from "bun:test";
import {
  formatSpec,
  formatVersion,
  formatSpecDetail,
  formatPushResult,
  formatValidateResult,
} from "../src/output";
import type { Spec, PublicSpecVersion, PushSpecResponse, CompatReport } from "@grapity/core";

// Strip ANSI escape codes so assertions work regardless of chalk styling
function strip(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, "");
}

// Dates as ISO strings — this is what JSON.parse produces, not Date objects.
// Using strings here is the key invariant: it would have caught the toISOString() crash.
const CREATED_AT = "2026-04-25T10:30:00.000Z";
const UPDATED_AT = "2026-04-25T11:00:00.000Z";

function makeSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    id: "spec-1",
    name: "payments-api",
    type: "openapi",
    tags: [],
    createdAt: CREATED_AT as unknown as Date,
    updatedAt: UPDATED_AT as unknown as Date,
    ...overrides,
  };
}

function makeVersion(overrides: Partial<PublicSpecVersion> = {}): PublicSpecVersion {
  return {
    id: "ver-1",
    specId: "spec-1",
    semver: "1.0.0",
    checksum: "abc123",
    isPrerelease: false,
    createdAt: CREATED_AT as unknown as Date,
    ...overrides,
  };
}

function makeCompatReport(overrides: Partial<CompatReport> = {}): CompatReport {
  return {
    previousVersion: "1.0.0",
    classification: "minor",
    breakingChanges: [],
    safeChanges: [],
    ...overrides,
  };
}

describe("formatSpec", () => {
  test("renders name and type", () => {
    const result = strip(formatSpec(makeSpec()));
    expect(result).toContain("payments-api");
    expect(result).toContain("openapi");
  });

  test("renders tags joined by comma when present", () => {
    const result = strip(formatSpec(makeSpec({ tags: ["billing", "payments"] })));
    expect(result).toContain("billing, payments");
  });

  test("renders 'no tags' when tags array is empty", () => {
    const result = strip(formatSpec(makeSpec({ tags: [] })));
    expect(result).toContain("no tags");
  });

  test("renders owner when present", () => {
    const result = strip(formatSpec(makeSpec({ owner: "platform-team" })));
    expect(result).toContain("platform-team");
  });

  test("renders 'unknown' when owner is absent", () => {
    const result = strip(formatSpec(makeSpec({ owner: undefined })));
    expect(result).toContain("unknown");
  });
});

describe("formatVersion", () => {
  test("renders semver", () => {
    const result = strip(formatVersion(makeVersion({ semver: "1.2.3" })));
    expect(result).toContain("1.2.3");
  });

  test("renders createdAt as string without calling toISOString", () => {
    const result = strip(formatVersion(makeVersion()));
    // Passes a string as createdAt — the bug would crash here if toISOString() were called
    expect(result).toContain("Pushed");
    expect(result).toContain(CREATED_AT);
  });

  test("appends pre badge when isPrerelease is true", () => {
    const result = strip(formatVersion(makeVersion({ isPrerelease: true })));
    expect(result).toContain("pre");
  });

  test("omits pre badge when isPrerelease is false", () => {
    const result = strip(formatVersion(makeVersion({ isPrerelease: false })));
    // "pre" only appears as a badge — not in semver or other fields
    expect(result).not.toContain(" pre");
  });

  test("renders gitRef when present", () => {
    const result = strip(formatVersion(makeVersion({ gitRef: "abc1234" })));
    expect(result).toContain("abc1234");
  });

  test("omits git line when gitRef is absent", () => {
    const result = strip(formatVersion(makeVersion({ gitRef: undefined })));
    expect(result).not.toContain("Git");
  });
});

describe("formatSpecDetail", () => {
  test("renders spec name and type", () => {
    const result = strip(formatSpecDetail(makeSpec()));
    expect(result).toContain("payments-api");
    expect(result).toContain("openapi");
  });

  test("renders description when present", () => {
    const result = strip(formatSpecDetail(makeSpec({ description: "Handles billing flows" })));
    expect(result).toContain("Handles billing flows");
  });

  test("omits description when absent", () => {
    const result = strip(formatSpecDetail(makeSpec({ description: undefined })));
    expect(result).not.toContain("Description");
  });

  test("renders owner when present", () => {
    const result = strip(formatSpecDetail(makeSpec({ owner: "platform-team" })));
    expect(result).toContain("platform-team");
  });

  test("omits owner when absent", () => {
    const result = strip(formatSpecDetail(makeSpec({ owner: undefined })));
    expect(result).not.toContain("platform-team");
  });

  test("renders sourceRepo when present", () => {
    const result = strip(formatSpecDetail(makeSpec({ sourceRepo: "https://github.com/acme/payments" })));
    expect(result).toContain("https://github.com/acme/payments");
  });

  test("omits sourceRepo when absent", () => {
    const result = strip(formatSpecDetail(makeSpec({ sourceRepo: undefined })));
    expect(result).not.toContain("github.com");
  });

  test("renders tags when present", () => {
    const result = strip(formatSpecDetail(makeSpec({ tags: ["billing", "payments"] })));
    expect(result).toContain("billing, payments");
  });

  test("omits tags section when tags is empty", () => {
    const result = strip(formatSpecDetail(makeSpec({ tags: [] })));
    expect(result).not.toContain("Tags");
  });

  test("renders createdAt as string without calling toISOString", () => {
    const result = strip(formatSpecDetail(makeSpec()));
    // Passes a string as createdAt — the bug would crash here if toISOString() were called
    expect(result).toContain("Created");
    expect(result).toContain(CREATED_AT);
  });

  test("renders latest version semver when latestVersion is provided", () => {
    const result = strip(formatSpecDetail(makeSpec(), makeVersion({ semver: "2.1.0" })));
    expect(result).toContain("2.1.0");
  });

  test("renders pushedBy in latest version block when present", () => {
    const result = strip(formatSpecDetail(makeSpec(), makeVersion({ pushedBy: "ci-bot" })));
    expect(result).toContain("ci-bot");
  });

  test("renders gitRef in latest version block when present", () => {
    const result = strip(formatSpecDetail(makeSpec(), makeVersion({ gitRef: "deadbeef" })));
    expect(result).toContain("deadbeef");
  });

  test("renders 'No versions yet' when latestVersion is undefined", () => {
    const result = strip(formatSpecDetail(makeSpec(), undefined));
    expect(result).toContain("No versions yet");
  });
});

describe("formatPushResult", () => {
  test("always renders validated confirmation", () => {
    const result = strip(formatPushResult({
      spec: makeSpec(),
      version: makeVersion(),
      isNewSpec: false,
    }));
    expect(result).toContain("validated");
  });

  test("renders new spec message when isNewSpec is true", () => {
    const result = strip(formatPushResult({
      spec: makeSpec({ name: "payments-api" }),
      version: makeVersion(),
      isNewSpec: true,
    }));
    expect(result).toContain("payments-api");
    expect(result).toContain("created");
  });

  test("omits new spec message when isNewSpec is false", () => {
    const result = strip(formatPushResult({
      spec: makeSpec(),
      version: makeVersion(),
      isNewSpec: false,
    }));
    expect(result).not.toContain("created");
  });

  test("renders compat summary when compatReport is present", () => {
    const report = makeCompatReport({
      breakingChanges: [{ id: "1", rule: "endpoint-removed", description: "...", path: "/foo" }],
      safeChanges: [
        { id: "2", rule: "endpoint-added", description: "...", path: "/bar" },
        { id: "3", rule: "endpoint-added", description: "...", path: "/baz" },
      ],
    });
    const result = strip(formatPushResult({
      spec: makeSpec(),
      version: makeVersion(),
      isNewSpec: false,
      compatReport: report,
    }));
    expect(result).toContain("1 breaking");
    expect(result).toContain("2 safe");
  });

  test("omits compat summary when compatReport is absent", () => {
    const result = strip(formatPushResult({
      spec: makeSpec(),
      version: makeVersion(),
      isNewSpec: false,
    }));
    expect(result).not.toContain("breaking");
  });

  test("renders version registered line with semver", () => {
    const result = strip(formatPushResult({
      spec: makeSpec(),
      version: makeVersion({ semver: "1.3.0" }),
      isNewSpec: false,
    }));
    expect(result).toContain("Version 1.3.0 registered");
  });

  test("renders force push warning when force option is true", () => {
    const result = strip(formatPushResult(
      { spec: makeSpec(), version: makeVersion(), isNewSpec: false },
      { force: true, reason: "security fix" }
    ));
    expect(result).toContain("Force push");
    expect(result).toContain("security fix");
  });
});

describe("formatValidateResult", () => {
  test("renders 'Spec is valid' for a valid result", () => {
    const result = strip(formatValidateResult({ valid: true }));
    expect(result).toContain("Spec is valid");
  });

  test("renders errors for an invalid result", () => {
    const result = strip(formatValidateResult({
      valid: false,
      errors: ["Missing required field: info", "Unknown schema type: foo"],
    }));
    expect(result).toContain("Missing required field: info");
    expect(result).toContain("Unknown schema type: foo");
  });

  test("handles missing errors array gracefully", () => {
    const result = strip(formatValidateResult({ valid: false }));
    expect(result).toContain("Spec is invalid");
    expect(result).not.toThrow;
  });
});
