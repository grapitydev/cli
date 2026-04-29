import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import { client } from "../../client";
import { formatPushResult, formatError } from "../../output";

export const pushCommand = new Command("push")
  .description("Push a spec to the registry")
  .argument("<file>", "Path to the spec file")
  .requiredOption("--name <name>", "Name of the spec")
  .option("--type <type>", "Spec type (openapi or asyncapi)")
  .option("--description <desc>", "Description of the spec")
  .option("--owner <owner>", "Owner of the spec")
  .option("--source-repo <url>", "Source repository URL")
  .option("--tags <tags>", "Comma-separated tags")
  .option("--git-ref <ref>", "Git commit SHA")
  .option("--pushed-by <by>", "Identity of the pusher")
  .option("--force", "Force push even with breaking changes")
  .option("--reason <reason>", "Reason for force push")
  .option("--prerelease", "Mark as pre-release version (0.x)")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    const content = fs.readFileSync(filePath, "utf-8");

    const spinner = ora({
      text: `Pushing ${chalk.hex("#6366f1").bold(options.name)}…`,
      color: "cyan",
    }).start();

    try {
      const result = await client.pushSpec({
        content,
        name: options.name,
        type: options.type,
        description: options.description,
        owner: options.owner,
        sourceRepo: options.sourceRepo,
        tags: options.tags?.split(","),
        gitRef: options.gitRef,
        pushedBy: options.pushedBy,
        prerelease: options.prerelease,
        force: options.force,
        reason: options.reason,
      });

      spinner.stop();
      console.log(formatPushResult(result, { force: options.force, reason: options.reason }));
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
