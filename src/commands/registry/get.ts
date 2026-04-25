import { Command } from "commander";
import { client } from "../../client";
import { formatSpecDetail } from "../../output";

export const getCommand = new Command("get")
  .description("Get details for a spec")
  .argument("<name>", "Name of the spec")
  .action(async (name) => {
    const result = await client.getSpec(name);
    if (!result) {
      console.error(`Spec "${name}" not found.`);
      process.exit(1);
    }
    console.log(formatSpecDetail(result.spec, result.latestVersion));
  });
