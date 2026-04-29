import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import { client } from "../../client";
import { formatValidateResult } from "../../output";

export const validateCommand = new Command("validate")
  .description("Validate a spec against the latest version in the registry")
  .argument("<file>", "Path to the spec file")
  .requiredOption("--against <name>", "Name of the spec to validate against")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    const content = fs.readFileSync(filePath, "utf-8");

    const spinner = ora({
      text: `Validating against ${chalk.hex("#6366f1").bold(options.against)}…`,
      color: "cyan",
    }).start();

    const result = await client.validateSpec(options.against, { content });

    spinner.stop();
    console.log(formatValidateResult(result));
  });
