import { assert, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { run } from "./cli.ts";

Deno.test("run fails when --md is missing", async () => {
  await assertRejects(
    () => run(["--html-out", "out/resume.html"]),
    Error,
    "Missing required flag --md",
  );
});

Deno.test("run generates HTML from markdown and css", async () => {
  const dir = await Deno.makeTempDir({ prefix: "cli-test-html-" });
  const mdPath = join(dir, "resume.md");
  const cssPath = join(dir, "styles.css");
  const htmlOut = join(dir, "resume.html");

  await Deno.writeTextFile(
    mdPath,
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
  await Deno.writeTextFile(cssPath, ".page { color: #111; }");

  await run([
    "--md",
    mdPath,
    "--css",
    cssPath,
    "--html-out",
    htmlOut,
  ]);

  const html = await Deno.readTextFile(htmlOut);
  assertStringIncludes(html, '<html lang="fr">');
  assertStringIncludes(
    html,
    '<link rel="stylesheet" href="https://example.com/icons.css" />',
  );
  assertStringIncludes(html, "Test summary");
  assertStringIncludes(html, "<style>.page { color: #111; }</style>");
});

Deno.test("run writes raw markdown and supports hidden inclusion flag", async () => {
  const dir = await Deno.makeTempDir({ prefix: "cli-test-raw-" });
  const mdPath = join(dir, "resume.md");
  const rawDefaultOut = join(dir, "raw-default.md");
  const rawWithHiddenOut = join(dir, "raw-with-hidden.md");

  await Deno.writeTextFile(
    mdPath,
    `# Jane Doe

## Summary
:::block{role=summary}
@summary Public summary
@hidden @summary Hidden summary
- Visible item
- @hidden Hidden item
@hidden Hidden markdown line
:::
`,
  );

  await run([
    "--md",
    mdPath,
    "--raw-md-out",
    rawDefaultOut,
  ]);

  await run([
    "--md",
    mdPath,
    "--raw-md-out",
    rawWithHiddenOut,
    "--raw-md-include-hidden",
  ]);

  const rawDefault = await Deno.readTextFile(rawDefaultOut);
  const rawWithHidden = await Deno.readTextFile(rawWithHiddenOut);

  assertStringIncludes(rawDefault, "Public summary");
  assert(!rawDefault.includes("Hidden summary"));
  assert(!rawDefault.includes("Hidden item"));

  assertStringIncludes(rawWithHidden, "Public summary");
  assertStringIncludes(rawWithHidden, "Hidden summary");
  assertStringIncludes(rawWithHidden, "Hidden item");
});
