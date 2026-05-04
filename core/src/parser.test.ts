import { assert, assertEquals, assertExists } from "@std/assert";
import { SemanticResumeParser } from "./parser.ts";

Deno.test("supports block-level @hidden marker inside a block", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Summary

:::block{role=summary}
@hidden
### Public Title
@summary Visible summary
:::
`);

  const section = ast.sections[0];
  const block = section.blocks[0];
  assertEquals(block.hidden, true);
  assertEquals(
    block.fields.some((field) => field.name === "summary" && !field.hidden),
    true,
  );
});

Deno.test("supports field-level @hidden directive", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Summary

:::block{role=summary}
@summary Visible summary
@hidden @summary Hidden summary
:::
`);

  const block = ast.sections[0].blocks[0];
  const visibleSummary = block.fields.find(
    (field) => field.name === "summary" && !field.hidden,
  );
  const hiddenSummary = block.fields.find(
    (field) => field.name === "summary" && field.hidden,
  );

  assertExists(visibleSummary);
  assertExists(hiddenSummary);
  assertEquals(hiddenSummary.value, "Hidden summary");
});

Deno.test("supports item-level @hidden marker", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Skills

:::block{role=skills}
- JavaScript
- @hidden COBOL
:::
`);

  const block = ast.sections[0].blocks[0];
  const visibleItem = block.items.find(
    (item) => item.value === "JavaScript" && !item.hidden,
  );
  const hiddenItem = block.items.find(
    (item) => item.value === "COBOL" && item.hidden,
  );

  assertExists(visibleItem);
  assertExists(hiddenItem);
});

Deno.test("supports plain-line @hidden marker", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Summary

:::block{role=summary}
@hidden Internal source note
@summary Public summary
:::
`);

  const block = ast.sections[0].blocks[0];
  const hiddenMarkdown = block.markdown.find((line) =>
    line.hidden && line.value === "Internal source note"
  );
  const visibleMarkdown = block.markdown.find((line) => !line.hidden);
  assertExists(hiddenMarkdown);
  assertEquals(visibleMarkdown, undefined);
});

Deno.test("supports standalone @hidden lines outside blocks", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe
@hidden Internal preamble line

## Summary
Visible section line
@hidden Internal section line
:::block{role=summary}
@summary Public summary
:::
`);

  assert(
    ast.preamble.markdown.some((line) =>
      line.hidden && line.value === "Internal preamble line"
    ),
  );

  const summary = ast.sections.find((section) => section.id === "summary");
  assertExists(summary);
  assert(
    summary.markdown.some((line) =>
      line.hidden && line.value === "Internal section line"
    ),
  );
});

Deno.test("treats @hidden ## headings as real sections", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Visible
:::block{role=summary}
@summary Public block
:::

@hidden ## Interests
:::block{role=interests}
- @icon photo_camera | Photography
:::
`);

  const visible = ast.sections.find((section) => section.id === "visible");
  const interests = ast.sections.find((section) => section.id === "interests");

  assertExists(visible);
  assertExists(interests);
  assertEquals(interests.title, "Interests");
  assertEquals(interests.titleHidden, true);
  assertEquals(interests.blocks.length, 1);
});

Deno.test("resolves section regions and block region override", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`---
regions:
  sidebar:
    sections:
      - skills
---
# Jane Doe

## Summary
:::block{role=summary region=header}
@summary Header summary block
:::

## Skills
:::block{role=skills}
- TypeScript
:::
`);

  const summary = ast.sections.find((section) => section.id === "summary");
  const skills = ast.sections.find((section) => section.id === "skills");

  assertExists(summary);
  assertExists(skills);

  assertEquals(summary.region, "main");
  assertEquals(skills.region, "sidebar");
  assertEquals(summary.blocks[0].region, "header");
  assertEquals(skills.blocks[0].region, "sidebar");
});

Deno.test("inherits section region for blocks and allows nested block override", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`---
regions:
  sidebar:
    sections: [experience]
---
# Jane Doe

## Experience
:::block{kind=job}
@summary Parent block

:::block{role=child}
@summary Child inherits
:::

:::block{role=child region=footer}
@summary Child override
:::
:::
`);

  const section = ast.sections.find((item) => item.id === "experience");
  assertExists(section);
  assertEquals(section.region, "sidebar");

  const parent = section.blocks[0];
  assertEquals(parent.region, "sidebar");
  assertEquals(parent.children.length, 2);
  assertEquals(parent.children[0].region, "sidebar");
  assertEquals(parent.children[1].region, "footer");
});

Deno.test("parses inline region section lists and falls back to main", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`---
regions:
  sidebar:
    sections: [skills, languages]
---
# Jane Doe

## Summary
:::block{role=summary}
@summary Profile
:::

## Skills
:::block{role=skills}
- TypeScript
:::
`);

  const summary = ast.sections.find((section) => section.id === "summary");
  const skills = ast.sections.find((section) => section.id === "skills");

  assertExists(summary);
  assertExists(skills);
  assertEquals(summary.region, "main");
  assertEquals(skills.region, "sidebar");
});

Deno.test("preserves unknown block attributes and unknown directives", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Projects
:::block{kind=project width=24mm align=right}
@custom extra-data
@summary Public summary
:::
`);

  const block = ast.sections[0].blocks[0];
  assertEquals(block.attrs.props.width, "24mm");
  assertEquals(block.attrs.props.align, "right");

  const customField = block.fields.find((field) => field.name === "custom");
  assertExists(customField);
  assertEquals(customField.known, false);
});

Deno.test("flags blocks without meaningful content", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Summary
:::block{role=summary}
:::
`);

  assert(
    ast.validation.errors.some((error) => error.code === "invalid-empty-block"),
  );
});

Deno.test("flags region conflicts when a section is assigned to multiple regions", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`---
regions:
  sidebar:
    sections:
      - skills
  footer:
    sections:
      - skills
---
# Jane Doe

## Skills
:::block{role=skills}
- TypeScript
:::
`);

  assert(
    ast.validation.errors.some((error) =>
      error.code === "section-region-conflict"
    ),
  );
});

Deno.test("keeps hidden content normalized in AST validation", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Summary
:::block{role=summary}
@hidden
@hidden @summary Hidden summary
- @hidden Hidden item
@hidden Hidden line
:::
`);

  assert(
    !ast.validation.errors.some((error) =>
      error.code === "hidden-field-not-normalized" ||
      error.code === "hidden-item-not-retained" ||
      error.code === "hidden-line-not-retained"
    ),
  );
});

Deno.test("does not treat :::entry as a supported block fence in core_bis", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`# Jane Doe

## Experience
:::entry{kind=job}
Legacy syntax
:::

:::block{kind=job}
@summary New syntax
:::
`);

  const section = ast.sections[0];
  assertEquals(section.blocks.length, 1);
  assert(section.markdown.some((line) => line.value.startsWith(":::entry")));
});

Deno.test("preserves top-level front matter objects like images map in config.raw", () => {
  const parser = new SemanticResumeParser();
  const ast = parser.parse(`---
images:
  profile: ./assets/maxime.png
  logo: ./assets/logo.svg
---
# Jane Doe
`);

  const images = ast.config.raw.images as Record<string, string>;
  assertExists(images);
  assertEquals(images.profile, "./assets/maxime.png");
  assertEquals(images.logo, "./assets/logo.svg");
});
