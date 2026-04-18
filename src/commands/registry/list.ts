import { Command } from "commander";
import { client } from "../../client";
import { formatSpec } from "../../output";

export const listCommand = new Command("list")
  .description("List all specs in the registry")
  .option("--type <type>", "Filter by spec type")
  .option("--owner <owner>", "Filter by owner")
  .option("--tags <tags>", "Filter by tags (comma-separated)")
  .action(async (options) => {
    const specs = await client.listSpecs({
      type: options.type,
      owner: options.owner,
      tags: options.tags?.split(","),
    });

    if (specs.length === 0) {
      console.log("No specs found.");
      return;
    }

    for (const spec of specs) {
      console.log(formatSpec(spec));
    }
  });