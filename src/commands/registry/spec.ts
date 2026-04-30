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
      const versionLabel = semver ?? "latest";
      console.log(formatHeader(name, `${options.format}  ·  ${versionLabel}`));
      console.log("");

      const content = await client.fetchSpec(name, {
        semver,
        format: options.format,
      });

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
