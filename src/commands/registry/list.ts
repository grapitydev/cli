import { Command } from "commander";
import { client } from "../../client";
import { formatSpec, formatEmptyState } from "../../output";

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
      console.log(formatEmptyState("No specs in the registry.", [
        "Push one with:  grapity registry push ./openapi.yaml --name my-api",
      ]));
      return;
    }

    for (const spec of specs) {
      console.log(formatSpec(spec));
    }
  });