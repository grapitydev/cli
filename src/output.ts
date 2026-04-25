import type {
  Spec,
  PublicSpecVersion,
  PushSpecResponse,
  ValidateSpecResponse,
} from "@grapity/core";

export function formatPushResult(result: PushSpecResponse): string {
  const lines: string[] = [];
  lines.push("Spec validated");

  if (result.compatReport) {
    const { breakingChanges, safeChanges } = result.compatReport;
    lines.push(
      `Backward compatibility: ${breakingChanges.length} breaking, ${safeChanges.length} safe changes`
    );
  }

  if (result.isNewSpec) {
    lines.push(`Spec "${result.spec.name}" created`);
  }

  lines.push(`Version ${result.version.semver} registered`);
  return lines.join("\n");
}

export function formatValidateResult(result: ValidateSpecResponse): string {
  if (result.valid) {
    return "Spec is valid";
  }
  return `Invalid spec:\n${result.errors?.join("\n") ?? "Unknown errors"}`;
}

export function formatSpec(spec: Spec): string {
  const lines: string[] = [
    `  ${spec.name} (${spec.type})`,
    `  Status: ${spec.tags.join(", ") || "no tags"}`,
    `  Owner: ${spec.owner ?? "unknown"}`,
  ];
  return lines.join("\n");
}

export function formatVersion(version: PublicSpecVersion): string {
  const lines: string[] = [
    `  ${version.semver}${version.isPrerelease ? " [prerelease]" : ""}`,
    `  Pushed: ${version.createdAt}`,
  ];
  if (version.gitRef) {
    lines.push(`  Git: ${version.gitRef}`);
  }
  return lines.join("\n");
}

export function formatSpecDetail(spec: Spec, latestVersion?: PublicSpecVersion): string {
  const lines: string[] = [
    `${spec.name} (${spec.type})`,
  ];
  if (spec.description) lines.push(`  Description: ${spec.description}`);
  if (spec.owner) lines.push(`  Owner: ${spec.owner}`);
  if (spec.sourceRepo) lines.push(`  Source: ${spec.sourceRepo}`);
  if (spec.tags.length > 0) lines.push(`  Tags: ${spec.tags.join(", ")}`);
  lines.push(`  Created: ${spec.createdAt}`);

  if (latestVersion) {
    lines.push(`  Latest: ${latestVersion.semver}${latestVersion.isPrerelease ? " [prerelease]" : ""}`);
    if (latestVersion.pushedBy) lines.push(`  Pushed by: ${latestVersion.pushedBy}`);
    if (latestVersion.gitRef) lines.push(`  Git: ${latestVersion.gitRef}`);
  } else {
    lines.push("  No versions yet.");
  }

  return lines.join("\n");
}
