import type {
  Spec,
  SpecVersion,
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

export function formatVersion(version: SpecVersion): string {
  const lines: string[] = [
    `  ${version.semver} [${version.status}]`,
    `  Pushed: ${version.createdAt.toISOString()}`,
  ];
  if (version.gitRef) {
    lines.push(`  Git: ${version.gitRef}`);
  }
  return lines.join("\n");
}