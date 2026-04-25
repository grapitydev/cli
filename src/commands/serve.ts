import { Command } from "commander";

export const serveCommand = new Command("serve")
  .description("Start the local Grapity registry server")
  .option("-p, --port <port>", "Port to listen on", "3750")
  .option("--db <url>", "Database URL (sqlite path or postgresql URL)")
  .option("--auth <mode>", "Auth mode: none, api-key, jwt", "none")
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const db = options.db;
    const auth = options.auth;

    try {
      const { startServer } = await import("@grapity/registry/serve");

      await startServer({
        port,
        database: db?.startsWith("postgresql://") ? "postgresql" : "sqlite",
        sqlitePath: db && !db.startsWith("postgresql://") ? db : undefined,
        postgresUrl: db?.startsWith("postgresql://") ? db : undefined,
        auth: auth === "none" ? { mode: "none" } : { mode: auth },
      });
    } catch {
      console.error(
        "Error: @grapity/registry is required for 'grapity serve'.\n" +
        "Install it with: npm install -g @grapity/registry"
      );
      process.exit(1);
    }
  });