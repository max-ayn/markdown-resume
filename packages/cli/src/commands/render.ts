import { watch } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import {
  buildResumeHtmlDocument,
  formatPageMargin,
  HtmlToPdfGenerator,
  injectBaseHref,
  inlineLocalAssetUrlsForPdf,
  materializeLocalImageAssets,
  renderMarkdown,
} from "@markdown-resume/core";
import { defineCommand, type ParsedArgs } from "citty";
import { consola } from "consola";
import { defineArgs } from "../args.ts";
import {
  ROOT,
  resolveInputFolder,
  resolveInputMarkdownPath,
  resolveStylePath,
  warnIfOverflowing,
} from "../utils.ts";

export const renderArgs = defineArgs([
  "input",
  "output",
  "md",
  "style",
  "with-pdf",
  "watch",
]);

type RenderArgs = ParsedArgs<typeof renderArgs>;

async function renderOnce(args: RenderArgs): Promise<void> {
  const inputMarkdown = await resolveInputMarkdownPath(
    args.input,
    args.md ?? null,
  );
  const stylePath = await resolveStylePath(
    await resolveInputFolder(args.input),
    args.style ?? null,
  );
  const outputBasename = basename(inputMarkdown, extname(inputMarkdown));
  const outputHtml = join(args.output, `${outputBasename}.html`);
  const outputPdf = join(args.output, `${outputBasename}.pdf`);

  const markdown = await readFile(inputMarkdown, "utf-8");
  const { data, html: htmlFragment, issues } = renderMarkdown(markdown);
  consola.info(`Validation: ${issues.length} issue(s)`);
  for (const issue of issues) {
    consola.warn(`${issue.line ? `line ${issue.line}: ` : ""}${issue.message}`);
  }

  const css = stylePath ? await readFile(stylePath, "utf-8") : "";
  const htmlDocument = buildResumeHtmlDocument(data, htmlFragment, css);
  const { html: htmlWithLocalAssets, missingSources } =
    await materializeLocalImageAssets(htmlDocument, inputMarkdown, outputHtml);
  for (const missingSource of missingSources) {
    consola.warn(
      `Image source not found: ${relative(
        ROOT,
        missingSource,
      )} (from ${inputMarkdown})`,
    );
  }

  await mkdir(dirname(outputHtml), { recursive: true });
  await writeFile(outputHtml, htmlWithLocalAssets, "utf-8");
  consola.success(`HTML written to ${relative(ROOT, outputHtml)}`);

  await warnIfOverflowing(data, htmlWithLocalAssets, outputHtml);

  if (!args["with-pdf"]) return;

  const pdfGenerator = new HtmlToPdfGenerator();
  const pdfHtmlWithBase = injectBaseHref(
    htmlWithLocalAssets,
    dirname(outputHtml),
  );
  const pdfHtml = await inlineLocalAssetUrlsForPdf(
    pdfHtmlWithBase,
    dirname(outputHtml),
  );
  await pdfGenerator.generate(pdfHtml, outputPdf, {
    title: "Resume",
    sourceHtmlPath: outputHtml,
    pageFormat: data.page?.size,
    pageMargin: formatPageMargin(data.page?.margin),
  });
  consola.success(`PDF written to ${relative(ROOT, outputPdf)}`);
}

async function watchAndRerender(args: RenderArgs): Promise<void> {
  const watchFolder = await resolveInputFolder(args.input);

  let running = false;
  let pending = false;
  const rerender = async () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await renderOnce(args);
    } catch (error) {
      consola.error(error instanceof Error ? error.message : error);
    } finally {
      running = false;
      if (pending) {
        pending = false;
        void rerender();
      }
    }
  };

  let timer: ReturnType<typeof setTimeout> | null = null;
  const scheduleRerender = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(rerender, 150);
  };

  watch(watchFolder, { recursive: true }, scheduleRerender);
  consola.info(
    `Watching ${relative(ROOT, watchFolder)} for changes... (ctrl-c to stop)`,
  );
  await rerender();
  await new Promise<never>(() => {});
}

async function runRender(args: RenderArgs): Promise<void> {
  if (args.watch) return watchAndRerender(args);
  await renderOnce(args);
}

export const renderCommand = defineCommand({
  meta: {
    description: "Render markdown + CSS into HTML",
  },
  args: renderArgs,
  run: ({ args }) => runRender(args),
});
