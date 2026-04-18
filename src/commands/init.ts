import { Command } from "commander";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

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
      console.error("Error: Cannot specify both --local and --remote.");
      process.exit(1);
    }

    if (options.local) {
      mode = "local";
    } else if (options.remote) {
      mode = "remote";
    } else {
      console.log("Select registry mode:");
      console.log("  1) Local  - Run a registry server on this machine (SQLite)");
      console.log("  2) Remote - Connect to an existing Grapity server");
      console.error("Error: Use --local or --remote to select mode.");
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
        console.error("Error: --url is required for remote mode. Example: --url https://api.grapity.dev");
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

    console.log(`Configuration written to ${configPath}`);
    console.log(`Mode: ${mode}`);

    if (mode === "local") {
      console.log(`Server will listen on port ${config.local?.port}`);
      console.log(`Database: ${config.local?.sqlitePath}`);
      console.log(`\nStart the server with: grapity serve`);
    } else {
      console.log(`Registry URL: ${config.remote?.url}`);
      if (config.remote?.apiKey) {
        console.log("API key: configured");
      }
      console.log(`\nPush a spec with: grapity registry push ./openapi.yaml --name my-api`);
    }
  });