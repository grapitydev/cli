import { Command } from "commander";
import { client } from "../../client";
import { formatSpecDetail, formatError } from "../../output";

export const getCommand = new Command("get")
  .description("Get details for a spec")
  .argument("<name>", "Name of the spec")
  .action(async (name) => {
    try {
      const result = await client.getSpec(name);
      console.log(formatSpecDetail(result.spec, result.latestVersion));
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
