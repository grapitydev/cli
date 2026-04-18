import { Command } from "commander";
import { pushCommand } from "./push";
import { validateCommand } from "./validate";
import { listCommand } from "./list";
import { versionsCommand } from "./versions";
import { deprecateCommand } from "./deprecate";

export const registryCommand = new Command("registry")
  .description("Manage specs in the Grapity registry")
  .addCommand(pushCommand)
  .addCommand(validateCommand)
  .addCommand(listCommand)
  .addCommand(versionsCommand)
  .addCommand(deprecateCommand);