import { Command } from "commander";
import { registryCommand } from "./commands/registry/index";
import { initCommand } from "./commands/init";
import { serveCommand } from "./commands/serve";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const program = new Command();

program
  .name("grapity")
  .description("Grapity - API spec registry and compatibility guardian")
  .version(version);

program.addCommand(registryCommand);
program.addCommand(initCommand);
program.addCommand(serveCommand);

program.parse();