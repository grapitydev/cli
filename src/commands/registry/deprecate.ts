import { Command } from "commander";
import { client } from "../../client";

export const deprecateCommand = new Command("deprecate")
  .description("Mark a spec version as deprecated")
  .argument("<name>", "Name of the spec")
  .argument("<semver>", "Version to deprecate")
  .requiredOption("--sunset <date>", "Sunset date (ISO 8601)")
  .action(async (name, semver, options) => {
    const result = await client.deprecateVersion(name, semver, {
      sunsetDate: options.sunset,
    });

    console.log(`Version ${semver} of "${name}" marked as deprecated.`);
    if (result.version.sunsetDate) {
      console.log(`Sunset date: ${result.version.sunsetDate.toISOString()}`);
    }
  });