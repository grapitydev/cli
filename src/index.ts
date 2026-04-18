import { Command } from "commander";
import { registryCommand } from "./commands/registry/index";
import { initCommand } from "./commands/init";
import { serveCommand } from "./commands/serve";

const program = new Command();

program
  .name("grapity")
  .description("Grapity - API spec registry and compatibility guardian")
  .version("0.0.1");

program.addCommand(registryCommand);
program.addCommand(initCommand);
program.addCommand(serveCommand);

program.parse();