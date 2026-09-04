import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import {
  buildStylesheetBoilerplate,
  renderMarkdown,
  STYLE_BOILERPLATE,
} from "@markdown-resume/core";
import { defineCommand } from "citty";
import { consola } from "consola";
import { defineArgs } from "../args.ts";
import { pathExists, ROOT, resolveInputMarkdownPath } from "../utils.ts";

export const generateStyleCommand = defineCommand({
  meta: {
    description: "Scaffold a starter stylesheet",
  },
  args: defineArgs(["input", "output", "md", "style", "force"]),
  async run({ args }) {
    const outputPath = resolve(args.output, args.style ?? "styles.css");

    if (!args.force && (await pathExists(outputPath))) {
      throw new Error(
        `${relative(
          ROOT,
          outputPath,
        )} already exists; pass --style <name> to write elsewhere, or -f to overwrite.`,
      );
    }

    let content = STYLE_BOILERPLATE;
    try {
      const inputMarkdown = await resolveInputMarkdownPath(
        args.input,
        args.md ?? null,
      );
      const markdown = await readFile(inputMarkdown, "utf-8");
      const { html } = renderMarkdown(markdown);
      content = buildStylesheetBoilerplate(html);
    } catch {
      // No resume markdown found (e.g. scaffolding a brand-new project) -
      // fall back to boilerplate alone rather than failing the command.
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, "utf-8");
    consola.success(
      `Stylesheet boilerplate written to ${relative(ROOT, outputPath)}`,
    );
  },
});
