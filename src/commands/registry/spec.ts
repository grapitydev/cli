import { Command } from "commander";
import { client } from "../../client";
import { formatHeader } from "../../output";

export const specCommand = new Command("spec")
  .description("Fetch the spec document for an API")
  .argument("<name>", "Name of the spec")
  .option("--version <semver>", "Specific version (default: latest)")
  .option("--format <format>", "Output format: json or yaml (default: yaml)", "yaml")
  .action(async (name, options) => {
    const versionLabel = options.version ?? "latest";
    console.log(formatHeader(name, `${options.format}  ·  ${versionLabel}`));
    console.log("");

    const content = await client.fetchSpec(name, {
      version: options.version,
      format: options.format,
    });
    console.log(content);
  });
