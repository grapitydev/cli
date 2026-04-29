import { Command } from "commander";
import { client } from "../../client";
import { formatSpecDetail, formatError } from "../../output";

export const getCommand = new Command("get")
  .description("Get details for a spec")
  .argument("<name>", "Name of the spec")
  .action(async (name) => {
    const result = await client.getSpec(name);
    if (!result) {
      console.error(
        formatError(
          "not found",
          `Spec "${name}" not found.`,
          [`Run grapity registry list to see available specs.`]
        )
      );
      process.exit(1);
    }
    console.log(formatSpecDetail(result.spec, result.latestVersion));
  });
