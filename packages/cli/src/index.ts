import process from "node:process";
import { defineCommand, runCommand } from "citty";
import pkg from "../package.json" with { type: "json" };
import { checkCommand as check } from "./commands/check.ts";
import { generateStyleCommand as generateStyle } from "./commands/generate-style.ts";
import {
  renderArgs as args,
  renderCommand as render,
} from "./commands/render.ts";
import { normalizeArgv } from "./utils.ts";

const { name, version } = pkg;

export const mainCommand = defineCommand({
  meta: {
    name,
    version,
    description: "*.md Resume - CLI.",
  },
  // Needed so citty's subcommand-boundary detection knows which flags take a value
  args,
  subCommands: {
    render,
    check,
    "generate-style": generateStyle,
  },
  default: "render",
});

/**
 * Runs the CLI and rejects on failure, for programmatic/test use.
 * See `cli-entry.ts` for the actual bin entry point.
 */
export async function run(
  rawArgv: readonly string[] = process.argv.slice(2),
): Promise<void> {
  await runCommand(mainCommand, { rawArgs: normalizeArgv(rawArgv) });
}
