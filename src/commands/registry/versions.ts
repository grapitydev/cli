import { Command } from "commander";
import { client } from "../../client";
import { formatVersion } from "../../output";

export const versionsCommand = new Command("versions")
  .description("List all versions of a spec")
  .argument("<name>", "Name of the spec")
  .action(async (name) => {
    const versions = await client.listVersions(name);

    if (versions.length === 0) {
      console.log(`No versions found for "${name}".`);
      return;
    }

    for (const version of versions) {
      console.log(formatVersion(version));
    }
  });