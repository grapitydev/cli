import type {
  PushSpecRequest,
  PushSpecResponse,
  ValidateSpecRequest,
  ValidateSpecResponse,
  ListSpecsResponse,
  GetSpecResponse,
  ListVersionsResponse,
  GetVersionResponse,
  GetCompatReportResponse,
  HealthResponse,
} from "@grapity/core";
import { getConfig, getRegistryUrl } from "./config";

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const baseUrl = getRegistryUrl();
  const url = `${baseUrl}${path}`;
  const config = getConfig();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.mode === "remote" && config.remote?.apiKey) {
    headers["X-API-Key"] = config.remote.apiKey;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function requestText(method: string, path: string): Promise<string> {
  const baseUrl = getRegistryUrl();
  const url = `${baseUrl}${path}`;
  const config = getConfig();

  const headers: Record<string, string> = {};

  if (config.mode === "remote" && config.remote?.apiKey) {
    headers["X-API-Key"] = config.remote.apiKey;
  }

  const response = await fetch(url, { method, headers });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message ?? `Request failed: ${response.status}`);
  }

  return response.text();
}

export const client = {
  pushSpec: async (data: PushSpecRequest) => {
    const res = await request<PushSpecResponse>("POST", "/v1/specs", data);
    return res.data;
  },

  validateSpec: async (name: string, data: ValidateSpecRequest) => {
    const res = await request<ValidateSpecResponse>("POST", `/v1/specs/${name}/validate`, data);
    return res.data;
  },

  listSpecs: async (params?: { type?: string; owner?: string; tags?: string[] }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.owner) searchParams.set("owner", params.owner);
    if (params?.tags) searchParams.set("tags", params.tags.join(","));
    const query = searchParams.toString();
    const res = await request<ListSpecsResponse>("GET", `/v1/specs${query ? `?${query}` : ""}`);
    return res.data;
  },

  getSpec: async (name: string) => {
    const res = await request<GetSpecResponse>("GET", `/v1/specs/${name}`);
    return res.data;
  },

  listVersions: (name: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
    if (params?.offset !== undefined) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    return request<ListVersionsResponse>("GET", `/v1/specs/${name}/versions${query ? `?${query}` : ""}`);
  },

  getVersion: async (name: string, semver: string) => {
    const res = await request<GetVersionResponse>("GET", `/v1/specs/${name}/versions/${semver}`);
    return res.data;
  },

  getCompatReport: async (name: string, semver: string) => {
    const res = await request<GetCompatReportResponse>("GET", `/v1/specs/${name}/compat/${semver}`);
    return res.data;
  },

  health: () => request<HealthResponse>("GET", "/v1/health"),

  fetchSpec: (name: string, options: { version?: string; format?: "json" | "yaml" }) => {
    const format = options.format ?? "yaml";
    const path = options.version
      ? `/v1/specs/${name}/versions/${options.version}/spec.${format}`
      : `/v1/specs/${name}/spec.${format}`;
    return requestText("GET", path);
  },
};
