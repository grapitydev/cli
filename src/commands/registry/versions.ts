import { Command } from "commander";
import { client } from "../../client";
import { formatVersion, formatVersionsFooter, formatEmptyState, formatError } from "../../output";

export const versionsCommand = new Command("versions")
  .description("List all versions of a spec")
  .argument("<name>", "Name of the spec")
  .option("--limit <n>", "Maximum number of versions to return (max 25)", "10")
  .option("--offset <n>", "Number of versions to skip", "0")
  .action(async (name, options) => {
    try {
      const limit = parseInt(options.limit, 10);
      const offset = parseInt(options.offset, 10);

      const result = await client.listVersions(name, { limit, offset });

      if (result.data.length === 0) {
        console.log(formatEmptyState(`No versions found for "${name}".`, [
          "Push the first version with:  grapity registry push ./spec.yaml --name " + name,
        ]));
        return;
      }

      for (const version of result.data) {
        console.log(formatVersion(version));
      }

      const footer = formatVersionsFooter(result.pagination);
      if (footer) console.log(footer);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
