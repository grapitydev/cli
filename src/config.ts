export interface Config {
  mode: "local" | "remote";
  registryUrl?: string;
  apiKey?: string;
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
  throw new Error("Not implemented");
}

export function getRegistryUrl(): string {
  const config = getConfig();
  if (config.mode === "remote") {
    return config.registryUrl ?? "https://api.grapity.dev";
  }
  return `http://localhost:${config.local?.port ?? 3750}`;
}