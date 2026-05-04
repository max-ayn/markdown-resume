import { assertMatch, assertNotMatch, assertStringIncludes } from "@std/assert";
import { SemanticResumeHtmlRenderer } from "./html-renderer.ts";
import { SemanticResumeParser } from "./parser.ts";

Deno.test("renders semantic section/block classes with data-region contract", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`---
regions:
  sidebar:
    sections: [skills]
---
# Jane Doe

## Skills
:::block{kind=project role=skills variant=timeline-card class=custom-pill}
@summary Built parser
:::
`);

  const html = renderer.render(ast);

  assertStringIncludes(
    html,
    '<div class="resume-region resume-region--sidebar" data-region="sidebar">',
  );
  assertStringIncludes(
    html,
    '<section class="resume-section resume-section--skills" data-section="skills" data-region="sidebar">',
  );
  assertStringIncludes(
    html,
    'class="resume-block resume-block--project resume-block--skills is-timeline-card custom-pill" data-region="sidebar"',
  );
});

Deno.test("skips hidden content by default", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe
@hidden Hidden preamble line

## Summary
@hidden Hidden section line
:::block{role=summary}
@summary Public summary
@hidden @summary Hidden summary
- Visible item
- @hidden Hidden item
@hidden Internal hidden line
:::

:::block{role=summary}
@hidden
@summary Hidden block summary
:::
`);

  const html = renderer.render(ast);

  assertStringIncludes(
    html,
    '<div class="resume-region resume-region--main" data-region="main">',
  );
  assertStringIncludes(html, "Public summary");
  assertStringIncludes(html, "Visible item");
  assertNotMatch(html, /Hidden preamble line/);
  assertNotMatch(html, /Hidden section line/);
  assertNotMatch(html, /Hidden summary/);
  assertNotMatch(html, /Hidden item/);
  assertNotMatch(html, /Internal hidden line/);
  assertNotMatch(html, /Hidden block summary/);
  assertNotMatch(html, /is-hidden-source/);
});

Deno.test("preserves hidden content in AST while omitting it from default HTML", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe

## Summary
:::block{role=summary}
@summary Public summary
@hidden @summary Hidden summary
- @hidden Hidden item
@hidden Hidden line
:::
`);

  const block = ast.sections[0].blocks[0];
  assertStringIncludes(
    JSON.stringify(block),
    '"hidden":true',
  );

  const html = renderer.render(ast);
  assertStringIncludes(
    html,
    '<div class="resume-region resume-region--main" data-region="main">',
  );
  assertStringIncludes(html, "Public summary");
  assertNotMatch(html, /Hidden summary/);
  assertNotMatch(html, /Hidden item/);
  assertNotMatch(html, /Hidden line/);
});

Deno.test("renders hidden content with .is-hidden-source in debug mode", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe
@hidden Hidden preamble line

## Summary
@hidden Hidden section line
:::block{role=summary}
@summary Public summary
@hidden @summary Hidden summary
- Visible item
- @hidden Hidden item
@hidden Internal hidden line
:::

:::block{role=summary}
@hidden
@summary Hidden block summary
:::
`);

  const html = renderer.render(ast, { debugHidden: true });

  assertStringIncludes(
    html,
    '<div class="resume-region resume-region--main" data-region="main">',
  );
  assertStringIncludes(html, "Public summary");
  assertStringIncludes(html, "Hidden preamble line");
  assertStringIncludes(html, "Hidden section line");
  assertStringIncludes(html, "Hidden summary");
  assertStringIncludes(html, "Hidden item");
  assertStringIncludes(html, "Internal hidden line");
  assertStringIncludes(html, "Hidden block summary");
  assertMatch(html, /class="[^"]*is-hidden-source[^"]*"/);
});

Deno.test("treats @hidden ## section headings as sections and hides title by default", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe

@hidden ## Interests
:::block{role=interests}
- @icon music_note_2 | Music
:::
`);

  const html = renderer.render(ast);
  assertStringIncludes(
    html,
    '<section class="resume-section resume-section--interests" data-section="interests" data-region="main">',
  );
  assertNotMatch(html, /<h2 class="resume-section__title">Interests<\/h2>/);
  assertStringIncludes(html, "music_note_2");
});

Deno.test("resolves @image aliases from front matter images map", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`---
images:
  profile: ./assets/avatar.png
---
# Jane Doe

:::block{role=profile-image region=header}
@image profile
:::
`);

  const html = renderer.render(ast);
  assertStringIncludes(
    html,
    '<figure class="resume-block__image"><img src="./assets/avatar.png" alt="Image" /></figure>',
  );
});

Deno.test("renders @stack field as badges", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe

## Experience
:::block{kind=job role=experience}
@stack React, Angular, FastAPI
:::
`);

  const html = renderer.render(ast);
  assertStringIncludes(html, '<div class="resume-block__stack">');
  assertStringIncludes(
    html,
    '<span class="resume-block__stack-badge">React</span>',
  );
  assertStringIncludes(
    html,
    '<span class="resume-block__stack-badge">Angular</span>',
  );
  assertStringIncludes(
    html,
    '<span class="resume-block__stack-badge">FastAPI</span>',
  );
});

Deno.test("renders icon-list and meter-list role blocks with structured item markup", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe

## Skills
:::block{role=icon-list}
- Ps | ●●●●○
:::

:::block{role=meter-list}
- CSS | 90
:::
`);

  const html = renderer.render(ast);
  assertStringIncludes(
    html,
    '<span class="resume-block__item-label">Ps</span><span class="resume-block__item-value">●●●●○</span>',
  );
  assertStringIncludes(
    html,
    '<div class="resume-meter"><span class="resume-meter__label">CSS</span><span class="resume-meter__value">90</span>',
  );
  assertStringIncludes(
    html,
    'class="resume-meter__fill" style="width: 90%;"',
  );
});

Deno.test("renders icon items with stable icon class and data-icon attribute", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe

## Contact
:::block{role=contact}
- @icon linkedin | linkedin.com/in/janedoe
:::
`);

  const html = renderer.render(ast);
  assertStringIncludes(
    html,
    '<span class="resume-block__icon resume-block__icon--linkedin material-symbols-outlined" data-icon="linkedin">linkedin</span>',
  );
});

Deno.test("renders markdown separator lines as hr elements", () => {
  const parser = new SemanticResumeParser();
  const renderer = new SemanticResumeHtmlRenderer();

  const ast = parser.parse(`# Jane Doe

---

## Summary
---
`);

  const html = renderer.render(ast);
  assertStringIncludes(html, '<hr class="resume-separator" />');
  assertNotMatch(html, /<p class="[^"]*">---<\/p>/);
});
