import { assertNotMatch, assertStringIncludes } from "@std/assert";
import { SemanticResumeParser } from "./parser.ts";
import { serializeResumeToRawMarkdown } from "./raw-markdown.ts";

Deno.test("serializes semantic blocks to plain Markdown without custom syntax", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Summary
:::block{role=summary}
@summary Public summary line
@note Open to relocation
:::
`);

  const raw = serializeResumeToRawMarkdown(ast);

  assertStringIncludes(raw, "# Jane Doe");
  assertStringIncludes(raw, "## Summary");
  assertStringIncludes(raw, "Public summary line");
  assertStringIncludes(raw, "Open to relocation");
  assertNotMatch(raw, /:::block/);
  assertNotMatch(raw, /@summary/);
  assertNotMatch(raw, /@note/);
});

Deno.test("skips hidden content by default and supports includeHidden", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Experience
:::block{kind=job}
### Software Engineer
@hidden @summary Hidden summary
@summary Visible summary
- @icon mail | max@example.com
- @hidden Internal only item
:::
`);

  const raw = serializeResumeToRawMarkdown(ast);
  assertStringIncludes(raw, "### Software Engineer");
  assertStringIncludes(raw, "Visible summary");
  assertStringIncludes(raw, "- mail: max@example.com");
  assertNotMatch(raw, /Hidden summary/);
  assertNotMatch(raw, /Internal only item/);

  const withHidden = serializeResumeToRawMarkdown(ast, { includeHidden: true });
  assertStringIncludes(withHidden, "Hidden summary");
  assertStringIncludes(withHidden, "- Internal only item");
});

Deno.test("resolves image aliases from front matter when serializing raw markdown", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`---
images:
  profile: ./assets/profile.jpg
---
# Jane Doe

:::block{role=profile-image}
@image profile
:::
`);

  const raw = serializeResumeToRawMarkdown(ast);
  assertStringIncludes(raw, "![Image](./assets/profile.jpg)");
  assertNotMatch(raw, /@image/);
});
