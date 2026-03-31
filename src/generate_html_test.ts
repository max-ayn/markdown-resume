import { assertMatch, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { MarkdownHtmlGenerator } from "./generate_html.ts";

async function withTempDir(fn: (dir: string) => Promise<void>) {
  const dir = await Deno.makeTempDir();
  try {
    await fn(dir);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

async function render(markdown: string, outputPath: string): Promise<string> {
  const generator = new MarkdownHtmlGenerator();
  const dir = await Deno.makeTempDir();
  try {
    const mdPath = join(dir, "resume.md");
    const cssPath = join(dir, "styles.css");
    await Deno.writeTextFile(mdPath, markdown);
    await Deno.writeTextFile(cssPath, ".page { color: black; }");
    await generator.generateHtml(mdPath, cssPath, outputPath);
    return await Deno.readTextFile(outputPath);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

Deno.test("parses headings, paragraphs, and bullet lists in sequence", async () => {
  await withTempDir(async (dir) => {
    const output = join(dir, "out", "resume.html");
    const html = await render(
      "# Title\n\nFirst line\nsecond line\n\n- item one\n- item two\n\n## Next",
      output,
    );

    assertStringIncludes(html, "<h1>Title</h1>");
    assertStringIncludes(html, "<p>First line second line</p>");
    assertStringIncludes(html, "<ul>");
    assertStringIncludes(html, "<li>item one</li>");
    assertStringIncludes(html, "<li>item two</li>");
    assertStringIncludes(html, '<h2 class="resume-section__title">Next</h2>');
  });
});

Deno.test("escapes html and applies inline formatting with hardened links", async () => {
  await withTempDir(async (dir) => {
    const output = join(dir, "out", "resume.html");
    const html = await render(
      "Text with <tag> & symbols, `code`, **bold**, *italic*, and [site](https://example.com).",
      output,
    );

    assertStringIncludes(html, "&lt;tag&gt; &amp; symbols");
    assertStringIncludes(html, "<code>code</code>");
    assertStringIncludes(html, "<strong>bold</strong>");
    assertStringIncludes(html, "<em>italic</em>");
    assertMatch(
      html,
      /<a href="https:\/\/example\.com" rel="noopener noreferrer">site<\/a>/,
    );
  });
});

Deno.test("creates output directory when it does not exist", async () => {
  await withTempDir(async (dir) => {
    const output = join(dir, "nested", "deep", "resume.html");
    const html = await render("Simple paragraph", output);
    assertStringIncludes(html, "<p>Simple paragraph</p>");
  });
});

Deno.test("supports sidebar_sections layout option via front matter", async () => {
  await withTempDir(async (dir) => {
    const output = join(dir, "out", "resume.html");
    const html = await render(
      `---
sidebar_sections:
  - projects
---
# Jane Doe

City, Country

## Summary
Profile text.

## Projects
- Demo project

## Skills
- TypeScript
`,
      output,
    );

    assertMatch(
      html,
      /<aside class="resume-sidebar">[\s\S]*resume-section--projects[\s\S]*<\/aside>/,
    );
    assertMatch(
      html,
      /<section class="resume-main">[\s\S]*resume-section--summary[\s\S]*<\/section>/,
    );
  });
});

Deno.test("parses sidebar_sections front matter with leading blanks and spaced fences", async () => {
  await withTempDir(async (dir) => {
    const output = join(dir, "out", "resume.html");
    const html = await render(
      `
  ---
sidebar_sections: [projects, skills]
  ---

# Jane Doe

City, Country

## Summary
Profile text.

## Projects
- Demo project

## Experience
- Work item

## Education
- School

## Languages
- English

## Interests
- Music
`,
      output,
    );

    assertMatch(
      html,
      /<aside class="resume-sidebar">[\s\S]*resume-section--projects[\s\S]*<\/aside>/,
    );
  });
});

Deno.test("supports style markers like [title] for targeted css hooks", async () => {
  await withTempDir(async (dir) => {
    const output = join(dir, "out", "resume.html");
    const html = await render(
      `# Jane Doe

## Summary
[hero] Profile text.

## Skills
- [core] TypeScript
- [secondary] Python

## Experience
:::entry{kind=job}
### [featured] Software Engineer
@meta [muted] 2024 - Present
- [impact] Built X
:::
`,
      output,
    );

    assertStringIncludes(html, 'class="resume-block--hero"');
    assertStringIncludes(html, 'class="resume-item--core"');
    assertStringIncludes(html, 'class="resume-item--secondary"');
    assertStringIncludes(html, 'class="resume-entry__title resume-entry__title--featured"');
    assertStringIncludes(html, 'class="resume-entry__meta resume-entry__meta--muted"');
    assertStringIncludes(html, 'class="resume-item--impact"');
  });
});
