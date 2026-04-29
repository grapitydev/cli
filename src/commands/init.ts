import { Command } from "commander";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { formatError, formatInitSuccess } from "../output";

interface InitConfig {
  mode: "local" | "remote";
  local?: {
    port: number;
    sqlitePath?: string;
  };
  remote?: {
    url: string;
    apiKey?: string;
  };
}

export const initCommand = new Command("init")
  .description("Configure Grapity registry (local or remote mode)")
  .option("--local", "Use local mode (SQLite)")
  .option("--remote", "Use remote mode (connect to a Grapity server)")
  .option("--url <url>", "Registry URL (for remote mode)")
  .option("--api-key <key>", "API key (for remote mode)")
  .option("--port <port>", "Port for local server (default: 3750)")
  .option("--db <path>", "Path to SQLite database file (for local mode)")
  .action(async (options) => {
    const configDir = path.join(os.homedir(), ".grapity");
    const configPath = path.join(configDir, "config.yaml");

    let mode: "local" | "remote";

    if (options.local && options.remote) {
      console.error(formatError("invalid flags", "Cannot specify both --local and --remote."));
      process.exit(1);
    }

    if (options.local) {
      mode = "local";
    } else if (options.remote) {
      mode = "remote";
    } else {
      console.error(
        formatError(
          "missing flag",
          "Select registry mode: use --local or --remote.",
          [
            "--local   Run a registry server on this machine (SQLite)",
            "--remote  Connect to an existing Grapity server",
          ]
        )
      );
      process.exit(1);
    }

    const config: InitConfig = { mode };

    if (mode === "local") {
      config.local = {
        port: options.port ? parseInt(options.port, 10) : 3750,
        sqlitePath: options.db,
      };

      if (!config.local.sqlitePath) {
        config.local.sqlitePath = path.join(os.homedir(), ".grapity", "registry.db");
      }
    } else {
      if (!options.url) {
        console.error(
          formatError(
            "missing flag",
            "--url is required for remote mode.",
            ["Example:  grapity init --remote --url https://api.grapity.dev"]
          )
        );
        process.exit(1);
      }

      config.remote = {
        url: options.url.replace(/\/$/, ""),
        apiKey: options.apiKey,
      };
    }

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const yamlContent = yaml.dump(config);
    fs.writeFileSync(configPath, yamlContent, "utf-8");

    console.log(
      formatInitSuccess({
        configPath,
        mode,
        port: config.local?.port,
        dbPath: config.local?.sqlitePath,
        url: config.remote?.url,
        hasApiKey: !!config.remote?.apiKey,
      })
    );
  });
