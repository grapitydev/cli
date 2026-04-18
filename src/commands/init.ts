import { Command } from "commander";
import os from "node:os";
import path from "node:path";
import type { Config } from "../config";

export const initCommand = new Command("init")
  .description("Configure Grapity registry (local or remote mode)")
  .option("--local", "Use local mode (SQLite)")
  .option("--remote", "Use remote mode (connect to a Grapity server)")
  .option("--url <url>", "Registry URL (for remote mode)")
  .option("--api-key <key>", "API key (for remote mode)")
  .action(async (options) => {
    const configDir = path.join(os.homedir(), ".grapity");
    const configPath = path.join(configDir, "config.yaml");

    throw new Error("Not implemented");
  });