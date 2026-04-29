import chalk from "chalk";
import type {
  Spec,
  PublicSpecVersion,
  PushSpecResponse,
  ValidateSpecResponse,
  PaginationMeta,
  BreakingChange,
  SafeChange,
} from "@grapity/core";

// Client unwraps the envelope before passing to output functions, so use the inner data types
type PushData = PushSpecResponse["data"];
type ValidateData = ValidateSpecResponse["data"];

// Brand color palette — mirrors grapity.dev design tokens
const c = {
  success:    chalk.hex("#a5f3c4"),
  successDim: chalk.hex("#a5f3c4").dim,
  error:      chalk.hex("#f43f5e"),
  errorBold:  chalk.hex("#f43f5e").bold,
  warning:    chalk.hex("#f59e0b"),
  accent:     chalk.hex("#6366f1").bold,
  accentDim:  chalk.hex("#6366f1"),
  cyan:       chalk.hex("#06b6d4"),
  label:      chalk.hex("#8888a0"),
  primary:    chalk.hex("#e4e4ed"),
  dim:        chalk.hex("#8888a0").dim,
};

const DIVIDER = `  ${c.dim("─".repeat(40))}`;
const MAX_CHANGE_ITEMS = 5;

function labelLine(label: string, value: string): string {
  return `  ${c.label(label.padEnd(11))}  ${value}`;
}

function changeItems(breaking: BreakingChange[], safe: SafeChange[]): string[] {
  const items = [
    ...breaking.map((b) => ({ rule: b.rule, path: b.path })),
    ...safe.map((s) => ({ rule: s.rule, path: s.path })),
  ];
  const shown = items.slice(0, MAX_CHANGE_ITEMS);
  const remaining = items.length - shown.length;
  const lines = shown.map(
    ({ rule, path }) => `    ↳ ${c.primary(rule.padEnd(36))} ${c.dim(path)}`
  );
  if (remaining > 0) {
    lines.push(`    ↳ ${c.dim(`… and ${remaining} more`)}`);
  }
  return lines;
}

export function formatPushResult(
  result: PushData,
  options?: { force?: boolean; reason?: string }
): string {
  const lines: string[] = [];
  const name = c.accent(result.spec.name);
  const type = c.cyan(result.spec.type);

  lines.push(`  ${c.success("✓")} ${name}  ${type}  validated`);

  if (result.compatReport) {
    const { breakingChanges, safeChanges, previousVersion } = result.compatReport;
    const bCount = breakingChanges.length;
    const sCount = safeChanges.length;
    const bText = bCount > 0 ? c.errorBold(`${bCount} breaking`) : c.successDim(`${bCount} breaking`);
    const sText = c.successDim(`${sCount} safe`);
    const range = c.dim(`${previousVersion} → ${result.version.semver}`);
    lines.push(`  ${c.accentDim("◆")} ${bText} ${c.label("·")} ${sText}  ${c.label("·")}  ${range}`);
    lines.push(...changeItems(breakingChanges, safeChanges));
  }

  if (result.isNewSpec) {
    lines.push(`  ${c.success("✓")} Spec ${name} created`);
  }

  if (options?.force) {
    const reasonPart = options.reason
      ? ` ${c.label("·")} reason: ${c.primary(options.reason)}`
      : "";
    lines.push(`  ${c.warning("⚠")}  ${c.warning("Force push")}${reasonPart}`);
  }

  lines.push(`  ${c.accentDim("◆")} Version ${c.accent(result.version.semver)} registered`);
  return lines.join("\n");
}

export function formatValidateResult(result: ValidateData): string {
  if (result.valid) {
    return `  ${c.success("✓")} Spec is valid`;
  }
  const errors = result.errors ?? ["Unknown errors"];
  const header = `  ${c.errorBold("✗")} ${c.errorBold("Spec is invalid")}  ${c.dim(`(${errors.length} ${errors.length === 1 ? "error" : "errors"})`)}`;
  const items = errors.map((e) => `    ↳ ${c.primary(e)}`);
  return [header, "", ...items].join("\n");
}

export function formatSpec(spec: Spec): string {
  const name = c.accent(spec.name);
  const type = c.cyan(spec.type);
  const tags = spec.tags.length > 0 ? c.primary(spec.tags.join(", ")) : c.dim("no tags");
  const owner = spec.owner ? c.primary(spec.owner) : c.dim("unknown");
  return [
    `  ${c.accentDim("▸")} ${name}  ${type}`,
    `    ${c.label("Owner")}  ${owner}    ${c.label("Tags")}  ${tags}`,
  ].join("\n");
}

export function formatVersion(version: PublicSpecVersion): string {
  const semver = c.accent(version.semver);
  const pre = version.isPrerelease ? `  ${c.warning("pre")}` : "";
  const pushed = c.primary(String(version.createdAt));
  let line2 = `    ${c.label("Pushed")}  ${pushed}`;
  if (version.gitRef) {
    line2 += `    ${c.label("Git")}  ${c.dim(version.gitRef)}`;
  }
  return [`  ${c.accentDim("◆")} ${semver}${pre}`, line2].join("\n");
}

export function formatSpecDetail(spec: Spec, latestVersion?: PublicSpecVersion): string {
  const lines: string[] = [];
  lines.push(`${c.accent(spec.name)}  ${c.cyan(spec.type)}`);
  lines.push("");

  if (spec.description) lines.push(labelLine("Description", c.primary(spec.description)));
  if (spec.owner)       lines.push(labelLine("Owner",       c.primary(spec.owner)));
  if (spec.sourceRepo)  lines.push(labelLine("Source",      c.primary(spec.sourceRepo)));
  if (spec.tags.length > 0) lines.push(labelLine("Tags",   c.primary(spec.tags.join(", "))));
  lines.push(labelLine("Created", c.dim(String(spec.createdAt))));

  lines.push("");
  lines.push(DIVIDER);
  lines.push(`  ${c.label("Latest version")}`);
  lines.push("");

  if (latestVersion) {
    const pre = latestVersion.isPrerelease ? `  ${c.warning("pre")}` : "";
    lines.push(`  ${c.accentDim("◆")} ${c.accent(latestVersion.semver)}${pre}`);
    if (latestVersion.pushedBy) lines.push(labelLine("Pushed by", c.primary(latestVersion.pushedBy)));
    if (latestVersion.gitRef)   lines.push(labelLine("Git",       c.dim(latestVersion.gitRef)));
  } else {
    lines.push(`  ${c.dim("· No versions yet.")}`);
  }

  return lines.join("\n");
}

export function formatError(descriptor: string, message: string, hints: string[] = []): string {
  const lines = [
    `  ${c.errorBold("error")}  ${c.error(descriptor)}`,
    "",
    `  ${c.primary(message)}`,
  ];
  if (hints.length > 0) {
    lines.push("");
    for (const hint of hints) {
      lines.push(`  ${c.dim("›")} ${c.primary(hint)}`);
    }
  }
  return lines.join("\n");
}

export function formatInitSuccess(params: {
  configPath: string;
  mode: "local" | "remote";
  port?: number;
  dbPath?: string;
  url?: string;
  hasApiKey?: boolean;
}): string {
  const lines = [
    `  ${c.success("✓")} Configuration written to ${c.dim(params.configPath)}`,
    "",
    `  ${c.label("Mode")}  ${c.primary(params.mode)}`,
  ];

  if (params.mode === "local") {
    if (params.port) lines.push(`  ${c.label("Port")}  ${c.cyan(String(params.port))}`);
    if (params.dbPath) lines.push(`  ${c.label("Database")}  ${c.dim(params.dbPath)}`);
    lines.push("");
    lines.push(`  ${c.dim("›")} Start the server with:  ${c.primary("grapity serve")}`);
  } else {
    if (params.url) lines.push(`  ${c.label("URL")}  ${c.cyan(params.url)}`);
    if (params.hasApiKey) lines.push(`  ${c.label("API key")}  ${c.dim("configured")}`);
    lines.push("");
    lines.push(`  ${c.dim("›")} Push a spec with:  ${c.primary("grapity registry push ./openapi.yaml --name my-api")}`);
  }

  return lines.join("\n");
}

export function formatServeConfig(params: {
  mode: "sqlite" | "postgresql";
  port: number;
  dbPath?: string;
  auth: string;
}): string {
  const modeLabel = `local ${c.label("·")} ${params.mode}`;
  const lines = [
    `  ${c.label("Mode")}      ${c.primary(modeLabel)}`,
    `  ${c.label("Port")}      ${c.cyan(String(params.port))}`,
  ];
  if (params.dbPath) lines.push(`  ${c.label("Database")}  ${c.dim(params.dbPath)}`);
  lines.push(`  ${c.label("Auth")}      ${c.primary(params.auth)}`);
  return lines.join("\n");
}

export function formatVersionsFooter(pagination: PaginationMeta): string | null {
  if (!pagination.hasMore) return null;
  const from = pagination.offset + 1;
  const to = pagination.offset + pagination.limit;
  return `  ${c.dim(`Showing ${from}–${to} of ${pagination.total}  ·  --offset ${to} to see more`)}`;
}

export function formatHeader(title: string, meta?: string): string {
  const metaPart = meta ? `  ${c.label("·")}  ${c.dim(meta)}` : "";
  return `  ${c.accentDim("◆")}  ${c.accent(title)}${metaPart}`;
}

export function formatEmptyState(message: string, hints?: string[]): string {
  const lines = [`  ${c.dim("·")} ${c.dim(message)}`];
  if (hints && hints.length > 0) {
    lines.push("");
    for (const hint of hints) {
      lines.push(`  ${c.dim("›")} ${c.primary(hint)}`);
    }
  }
  return lines.join("\n");
}

export function formatReady(port: number): string {
  return `  ${c.success("●")}  Server ready  ${c.label("·")}  ${c.cyan(`http://localhost:${port}`)}`;
}

export function formatShutdown(): string {
  return `  ${c.accentDim("◆")}  Shutting down Grapity Registry`;
}
