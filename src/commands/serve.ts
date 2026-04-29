import { Command } from "commander";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { formatError, formatServeConfig, formatHeader } from "../output";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

export const serveCommand = new Command("serve")
  .description("Start the local Grapity registry server")
  .option("-p, --port <port>", "Port to listen on", "3750")
  .option("--db <url>", "Database URL (sqlite path or postgresql URL)")
  .option("--auth <mode>", "Auth mode: none, api-key, jwt", "none")
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const db = options.db;
    const auth = options.auth;
    const isPostgres = db?.startsWith("postgresql://");
    const dbMode: "sqlite" | "postgresql" = isPostgres ? "postgresql" : "sqlite";
    const dbPath = isPostgres
      ? undefined
      : (db ?? path.join(os.homedir(), ".grapity", "registry.db"));

    console.log(formatHeader("Grapity Registry", `v${version}`));
    console.log("");
    console.log(formatServeConfig({ mode: dbMode, port, dbPath, auth }));
    console.log("");

    try {
      const { startServer } = await import("@grapity/registry/serve");

      await startServer({
        port,
        database: dbMode,
        sqlitePath: dbPath,
        postgresUrl: isPostgres ? db : undefined,
        auth: auth === "none" ? { mode: "none" } : { mode: auth },
      });

      const { formatReady, formatShutdown } = await import("../output");
      console.log(formatReady(port));

      process.on("SIGINT", () => {
        console.log("");
        console.log(formatShutdown());
        process.exit(0);
      });
    } catch (error: any) {
      if (
        error?.code === "ERR_MODULE_NOT_FOUND" ||
        error?.code === "MODULE_NOT_FOUND"
      ) {
        console.error(
          formatError(
            "missing dependency",
            "@grapity/registry is required for 'grapity serve'.",
            ["Install it with:  npm install -g @grapity/registry"]
          )
        );
        process.exit(1);
      }
      throw error;
    }
  });
