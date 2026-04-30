import { Command } from "commander";
import { client } from "../../client";
import { formatHeader, formatError, highlightJson, highlightYaml } from "../../output";

export const specCommand = new Command("spec")
  .description("Fetch the spec document for an API")
  .argument("<name>", "Name of the spec")
  .option("--semver <semver>", "Specific version (default: latest)")
  .option("--format <format>", "Output format: json or yaml (default: yaml)", "yaml")
  .action(async (name, options) => {
    try {
      const semver = options.semver?.trim().replace(/[,;.:]+$/, "");

      const { content, resolvedVersion } = await client.fetchSpec(name, {
        semver,
        format: options.format,
      });

      let versionLabel: string;
      if (semver) {
        versionLabel = semver;
      } else if (resolvedVersion) {
        versionLabel = `${resolvedVersion} (latest)`;
      } else {
        versionLabel = "latest";
      }

      console.log(formatHeader(name, `${options.format}  ·  ${versionLabel}`));
      console.log("");

      const useColors = process.stdout.isTTY ?? false;
      const output = options.format === "json"
        ? (useColors ? highlightJson(content) : JSON.stringify(JSON.parse(content), null, 2))
        : (useColors ? highlightYaml(content) : content);
      console.log(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
