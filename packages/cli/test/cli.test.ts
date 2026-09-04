import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { run } from "../src/index.ts";

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

it("run auto-discovers resume.md and styles.css in the input folder", async () => {
  const dir = await tempDir("cli-test-html-");
  const outDir = await tempDir("cli-test-out-");

  await writeFile(
    join(dir, "resume.md"),
    `---
lang: fr
icons:
  - https://example.com/icons.css
---
# Jane Doe

## Summary
:::block{role=summary}
@summary Test summary
:::
`,
  );
  await writeFile(join(dir, "styles.css"), ".page { color: #111; }", "utf-8");

  await run(["-i", dir, "-o", outDir]);

  const html = await readFile(join(outDir, "resume.html"), "utf-8");
  expect(html).toContain('<html lang="fr">');
  expect(html).toContain(
    '<link rel="stylesheet" href="https://example.com/icons.css" />',
  );
  expect(html).toContain("Test summary");
  expect(html).toContain("<style>.page { color: #111; }</style>");
});

it("run drops @hidden lines from the rendered HTML", async () => {
  const dir = await tempDir("cli-test-hidden-");
  const outDir = await tempDir("cli-test-out-");

  await writeFile(
    join(dir, "resume.md"),
    `# Jane Doe

## Summary
:::block{role=summary}
@summary Public summary
@hidden Hidden note
:::
`,
  );
  await writeFile(join(dir, "styles.css"), "", "utf-8");

  await run(["-i", dir, "-o", outDir]);

  const html = await readFile(join(outDir, "resume.html"), "utf-8");
  expect(html).toContain("Public summary");
  expect(html.includes("Hidden note")).toBe(false);
});

it("run fails when no markdown file is found", async () => {
  const dir = await tempDir("cli-test-empty-");
  await expect(run(["-i", dir])).rejects.toThrow("No markdown file found");
});

it("run fails when multiple markdown files are found without --md", async () => {
  const dir = await tempDir("cli-test-ambiguous-");
  await writeFile(join(dir, "a.md"), "# A\n");
  await writeFile(join(dir, "b.md"), "# B\n");

  await expect(run(["-i", dir])).rejects.toThrow(
    "Multiple markdown files found",
  );
});

it("run disambiguates via --md when multiple markdown files exist", async () => {
  const dir = await tempDir("cli-test-md-flag-");
  const outDir = await tempDir("cli-test-out-");
  await writeFile(join(dir, "a.md"), "# A\n");
  await writeFile(join(dir, "b.md"), "# B\n");
  await writeFile(join(dir, "styles.css"), "", "utf-8");

  await run(["-i", dir, "-o", outDir, "--md", "b.md"]);

  const html = await readFile(join(outDir, "b.html"), "utf-8");
  expect(html).toContain("B");
});

it("run disambiguates via -m/-s single-char aliases", async () => {
  const dir = await tempDir("cli-test-short-alias-");
  const outDir = await tempDir("cli-test-out-");
  await writeFile(join(dir, "a.md"), "# A\n");
  await writeFile(join(dir, "b.md"), "# B\n");
  await writeFile(join(dir, "a.css"), ".page { color: red; }", "utf-8");
  await writeFile(join(dir, "b.css"), ".page { color: blue; }", "utf-8");

  await run(["-i", dir, "-o", outDir, "-m", "b.md", "-s", "b.css"]);

  const html = await readFile(join(outDir, "b.html"), "utf-8");
  expect(html).toContain("B");
  expect(html).toContain("<style>.page { color: blue; }</style>");
});

it("render subcommand, called explicitly by name, behaves like the default", async () => {
  const dir = await tempDir("cli-test-explicit-render-");
  const outDir = await tempDir("cli-test-out-");
  await writeFile(join(dir, "resume.md"), "# Jane Doe\n");
  await writeFile(join(dir, "styles.css"), "", "utf-8");

  await run(["render", "-i", dir, "-o", outDir]);

  const html = await readFile(join(outDir, "resume.html"), "utf-8");
  expect(html).toContain("Jane Doe");
});

it("run rejects an unrecognized leading command", async () => {
  const dir = await tempDir("cli-test-unknown-command-");
  await expect(run(["foo", "-i", dir])).rejects.toThrow("Unknown command");
});

it("run -w re-renders when the markdown file changes", async () => {
  const dir = await tempDir("cli-test-watch-");
  const outDir = await tempDir("cli-test-out-");
  const mdPath = join(dir, "resume.md");
  await writeFile(mdPath, "# Jane Doe\n\nFirst version\n");
  await writeFile(join(dir, "styles.css"), "", "utf-8");

  void run(["-i", dir, "-o", outDir, "-w"]);

  await waitForFileContent(join(outDir, "resume.html"), "First version");

  await writeFile(mdPath, "# Jane Doe\n\nSecond version\n");
  await waitForFileContent(
    join(outDir, "resume.html"),
    "Second version",
    15000,
  );
}, 25000);

async function waitForFileContent(
  path: string,
  expected: string,
  timeoutMs = 10000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const content = await readFile(path, "utf-8").catch(() => "");
    if (content.includes(expected)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error(`Timed out waiting for ${path} to contain "${expected}"`);
}

it("generate-style writes a boilerplate stylesheet when no resume is found", async () => {
  const dir = await tempDir("cli-test-generate-style-no-resume-");
  const outDir = await tempDir("cli-test-generate-style-");

  await run(["generate-style", "-i", dir, "-o", outDir]);

  const css = await readFile(join(outDir, "styles.css"), "utf-8");
  expect(css).toContain("--page-bg");
  expect(css).toContain(".page {");
});

it("generate-style refuses to overwrite an existing stylesheet", async () => {
  const outDir = await tempDir("cli-test-generate-style-conflict-");
  await writeFile(join(outDir, "styles.css"), ".page { color: red; }", "utf-8");

  await expect(run(["generate-style", "-o", outDir])).rejects.toThrow(
    "already exists",
  );
});

it("generate-style -f overwrites an existing stylesheet", async () => {
  const outDir = await tempDir("cli-test-generate-style-force-");
  await writeFile(join(outDir, "styles.css"), ".page { color: red; }", "utf-8");

  await run(["generate-style", "-o", outDir, "-f"]);

  const css = await readFile(join(outDir, "styles.css"), "utf-8");
  expect(css).toContain("--page-bg");
});

it("generate-style adds an empty rule for each class used in the resume, alongside the boilerplate", async () => {
  const dir = await tempDir("cli-test-generate-style-classes-");
  const outDir = await tempDir("cli-test-generate-style-classes-out-");

  await writeFile(
    `${dir}/resume.md`,
    `# Jane Doe

## Summary
:::block{role=summary}
@summary Test summary
:::
`,
  );

  await run(["generate-style", "-i", dir, "-o", outDir]);

  const css = await readFile(join(outDir, "styles.css"), "utf-8");
  expect(css).toContain("--page-bg");
  expect(css).toContain(".resume-block {\n}");
  expect(css).toContain(".resume-block--summary {\n}");
});
