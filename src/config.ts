import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

export interface Config {
  mode: "local" | "remote";
  remote?: {
    url: string;
    apiKey?: string;
  };
  local?: {
    port: number;
    sqlitePath?: string;
  };
}

const DEFAULT_CONFIG: Config = {
  mode: "local",
  local: {
    port: 3750,
  },
};

export function getConfig(): Config {
  const configPath = path.join(os.homedir(), ".grapity", "config.yaml");

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const content = fs.readFileSync(configPath, "utf-8");
  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch {
    return DEFAULT_CONFIG;
  }

  if (!parsed || typeof parsed !== "object") {
    return DEFAULT_CONFIG;
  }

  const config = parsed as Config;
  return {
    mode: config.mode ?? DEFAULT_CONFIG.mode,
    remote: config.remote,
    local: {
      port: config.local?.port ?? DEFAULT_CONFIG.local!.port,
      sqlitePath: config.local?.sqlitePath,
    },
  };
}

export function getRegistryUrl(): string {
  const config = getConfig();
  if (config.mode === "remote") {
    return config.remote?.url ?? "https://api.grapity.dev";
  }
  return `http://localhost:${config.local?.port ?? 3750}`;
}