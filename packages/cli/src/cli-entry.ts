import process from "node:process";
import { runMain } from "citty";
import { mainCommand } from "./index.ts";
import { normalizeArgv } from "./utils.ts";

runMain(mainCommand, { rawArgs: normalizeArgv(process.argv.slice(2)) });
