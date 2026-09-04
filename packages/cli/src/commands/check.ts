import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import {
  buildResumeHtmlDocument,
  materializeLocalImageAssets,
  renderMarkdown,
} from "@markdown-resume/core";
import { defineCommand } from "citty";
import { consola } from "consola";
import { defineArgs } from "../args.ts";
import {
  resolveInputFolder,
  resolveInputMarkdownPath,
  resolveStylePath,
  warnIfOverflowing,
} from "../utils.ts";

export const checkCommand = defineCommand({
  meta: {
    description: "Validate markdown syntax",
  },
  args: defineArgs(["input", "md"]),
  async run({ args }) {
    const inputMarkdown = await resolveInputMarkdownPath(
      args.input,
      args.md ?? null,
    );
    const markdown = await readFile(inputMarkdown, "utf-8");
    const { data, html: htmlFragment, issues } = renderMarkdown(markdown);

    consola.info(`Validation: ${issues.length} issue(s)`);
    for (const issue of issues) {
      consola.warn(
        `${issue.line ? `line ${issue.line}: ` : ""}${issue.message}`,
      );
    }
    if (issues.length > 0) process.exitCode = 1;

    if (data.single_page !== true) return;

    const stylePath = await resolveStylePath(
      await resolveInputFolder(args.input),
      null,
    );
    const css = stylePath ? await readFile(stylePath, "utf-8") : "";
    const htmlDocument = buildResumeHtmlDocument(data, htmlFragment, css);

    const tempDir = await mkdtemp(join(tmpdir(), "markdown-resume-check-"));
    try {
      const tempHtmlPath = join(tempDir, "resume.html");
      const { html: htmlWithLocalAssets } = await materializeLocalImageAssets(
        htmlDocument,
        inputMarkdown,
        tempHtmlPath,
      );
      await writeFile(tempHtmlPath, htmlWithLocalAssets, "utf-8");

      const overflowed = await warnIfOverflowing(
        data,
        htmlWithLocalAssets,
        tempHtmlPath,
      );
      if (overflowed) process.exitCode = 1;
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  },
});
