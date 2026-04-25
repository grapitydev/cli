import { test, expect, describe, beforeAll, afterAll, beforeEach } from "bun:test";
import os from "node:os";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";
import { getConfig, getRegistryUrl } from "../src/config";

// Monkey-patch os.homedir on the shared module object so config.ts sees the
// same override (it imports the same node:os singleton we're modifying here).
const tmpHome = mkdtempSync(join(tmpdir(), "grapity-config-test-"));
const realHomedir = os.homedir.bind(os);

beforeAll(() => {
  os.homedir = () => tmpHome;
});

afterAll(() => {
  os.homedir = realHomedir;
  rmSync(tmpHome, { recursive: true, force: true });
});

function writeConfig(config: object) {
  const dir = join(tmpHome, ".grapity");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.yaml"), yaml.dump(config), "utf-8");
}

function removeConfig() {
  rmSync(join(tmpHome, ".grapity"), { recursive: true, force: true });
}

beforeEach(() => {
  removeConfig();
});

describe("getConfig", () => {
  test("returns default config when no config file exists", () => {
    const config = getConfig();
    expect(config.mode).toBe("local");
    expect(config.local?.port).toBe(3750);
  });

  test("returns local config with correct port", () => {
    writeConfig({ mode: "local", local: { port: 4000 } });
    const config = getConfig();
    expect(config.mode).toBe("local");
    expect(config.local?.port).toBe(4000);
  });

  test("returns local config with sqlitePath when set", () => {
    writeConfig({ mode: "local", local: { port: 3750, sqlitePath: "/data/registry.db" } });
    const config = getConfig();
    expect(config.local?.sqlitePath).toBe("/data/registry.db");
  });

  test("returns remote config with url and apiKey", () => {
    writeConfig({ mode: "remote", remote: { url: "https://api.grapity.dev", apiKey: "secret" } });
    const config = getConfig();
    expect(config.mode).toBe("remote");
    expect(config.remote?.url).toBe("https://api.grapity.dev");
    expect(config.remote?.apiKey).toBe("secret");
  });

  test("falls back to default port when local port is missing", () => {
    writeConfig({ mode: "local", local: {} });
    const config = getConfig();
    expect(config.local?.port).toBe(3750);
  });

  test("returns default config when file content is invalid YAML", () => {
    const dir = join(tmpHome, ".grapity");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "config.yaml"), "{ invalid yaml: [", "utf-8");
    const config = getConfig();
    expect(config.mode).toBe("local");
  });
});

describe("getRegistryUrl", () => {
  test("returns localhost with default port for local config", () => {
    writeConfig({ mode: "local", local: { port: 3750 } });
    expect(getRegistryUrl()).toBe("http://localhost:3750");
  });

  test("returns localhost with custom port for local config", () => {
    writeConfig({ mode: "local", local: { port: 4242 } });
    expect(getRegistryUrl()).toBe("http://localhost:4242");
  });

  test("returns configured url for remote config", () => {
    writeConfig({ mode: "remote", remote: { url: "https://registry.acme.com" } });
    expect(getRegistryUrl()).toBe("https://registry.acme.com");
  });

  test("returns api.grapity.dev as fallback when remote url is missing", () => {
    writeConfig({ mode: "remote", remote: {} });
    expect(getRegistryUrl()).toBe("https://api.grapity.dev");
  });
});
