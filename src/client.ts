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

export const client = {
  pushSpec: (data: PushSpecRequest) =>
    request<PushSpecResponse>("POST", "/v1/specs", data),

  validateSpec: (name: string, data: ValidateSpecRequest) =>
    request<ValidateSpecResponse>("POST", `/v1/specs/${name}/validate`, data),

  listSpecs: (params?: { type?: string; owner?: string; tags?: string[] }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.owner) searchParams.set("owner", params.owner);
    if (params?.tags) searchParams.set("tags", params.tags.join(","));
    const query = searchParams.toString();
    return request<ListSpecsResponse>("GET", `/v1/specs${query ? `?${query}` : ""}`);
  },

  getSpec: (name: string) =>
    request<GetSpecResponse>("GET", `/v1/specs/${name}`),

  listVersions: (name: string) =>
    request<ListVersionsResponse>("GET", `/v1/specs/${name}/versions`),

  getVersion: (name: string, semver: string) =>
    request<GetVersionResponse>("GET", `/v1/specs/${name}/versions/${semver}`),

  getCompatReport: (name: string, semver: string) =>
    request<GetCompatReportResponse>("GET", `/v1/specs/${name}/compat/${semver}`),

  health: () => request<HealthResponse>("GET", "/v1/health"),
};