import { expect, it } from "vitest";
import { renderMarkdown } from "./markdown.ts";

it("renders fields, containers, and headings", () => {
  const { html, issues } = renderMarkdown(`---
custom:
  field:
    - title
    - subtitle
---
## Jane Doe {.name}

:::block{role=title}
@subtitle Senior Engineer
:::
`);

  expect(issues).toEqual([]);
  expect(html).toContain('<h2 class="name">Jane Doe</h2>');
  expect(html).toContain("resume-block--title");
  expect(html).toContain('<div class="resume-field resume-field--subtitle">Senior Engineer</div>');
});

it("drops @hidden lines", () => {
  const { html } = renderMarkdown("@hidden ## Secret\n\nVisible text\n");
  expect(html.includes("Secret")).toBe(false);
  expect(html).toContain("Visible text");
});

it("flags unknown markers and unknown image keys", () => {
  const { issues } = renderMarkdown("@bogus not a real marker\n\n@image missing\n");
  expect(issues.length).toBe(2);
  expect(issues[0].message).toContain('unknown marker "bogus"');
  expect(issues[1].message).toContain('unknown image key "missing"');
});

it("resolves @image against frontmatter images", () => {
  const { html, issues } = renderMarkdown(`---
images:
  profile: ./assets/profile.png
---
@image profile | Profile picture
`);
  expect(issues).toEqual([]);
  expect(html).toContain('src="./assets/profile.png"');
});

it("formats @date using the configured default format", () => {
  const { html } = renderMarkdown(`---
date:
  default: yyyy-MM-dd
---
@date 01/02/2024
`);
  expect(html).toContain("2024-02-01");
});

it("formats both sides of a @date range separated by a hyphen", () => {
  const { html } = renderMarkdown(
    `@date:year 11/11/2018 - @date:year 07/07/2020\n`,
  );
  expect(html).toContain("Nov 2018");
  expect(html).toContain("Jul 2020");
  expect(html.includes("07/07/2020</span>")).toBe(false);
});

it("groups sections into region wrappers per frontmatter regions", () => {
  const { html } = renderMarkdown(`---
regions:
  main:
    sections:
      - summary
  sidebar:
    sections:
      - contact
---
## Contact {.contact}

Sidebar content

## Summary {.summary}

Main content
`);

  const mainIndex = html.indexOf('data-region="main"');
  const sidebarIndex = html.indexOf('data-region="sidebar"');
  expect(mainIndex > -1).toBe(true);
  expect(sidebarIndex > -1).toBe(true);
  // Regions render in frontmatter declaration order ("main" listed first).
  expect(mainIndex < sidebarIndex).toBe(true);

  const sidebarSection = html.slice(sidebarIndex);
  expect(sidebarSection).toContain("Sidebar content");
  expect(sidebarSection.includes("Main content")).toBe(false);
});

it("renders regions in the order their keys appear in frontmatter, not a fixed order", () => {
  const { html } = renderMarkdown(`---
regions:
  sidebar:
    sections:
      - contact
  main:
    sections:
      - summary
---
## Contact {.contact}

Sidebar content

## Summary {.summary}

Main content
`);

  const sidebarIndex = html.indexOf('data-region="sidebar"');
  const mainIndex = html.indexOf('data-region="main"');
  expect(sidebarIndex > -1).toBe(true);
  expect(mainIndex > -1).toBe(true);
  // "sidebar" is declared before "main" here, so it must render first.
  expect(sidebarIndex < mainIndex).toBe(true);
});

it("orders sections within a region by the declared sections list, not source order", () => {
  const { html } = renderMarkdown(`---
regions:
  main:
    sections:
      - second
      - first
---
## First {.first}

First content

## Second {.second}

Second content
`);

  const firstIndex = html.indexOf("First content");
  const secondIndex = html.indexOf("Second content");
  expect(secondIndex > -1).toBe(true);
  expect(firstIndex > -1).toBe(true);
  // "second" is declared before "first", so it must render first even
  // though "First" appears first in the source.
  expect(secondIndex < firstIndex).toBe(true);
});

it("appends undeclared sections after the declared ones, in source order", () => {
  const { html } = renderMarkdown(`---
regions:
  main:
    sections:
      - named
---
## Untagged

Untagged content

## Named {.named}

Named content
`);

  const namedIndex = html.indexOf("Named content");
  const untaggedIndex = html.indexOf("Untagged content");
  expect(namedIndex < untaggedIndex).toBe(true);
});

it("keeps a hidden heading's block anchored to its declared region", () => {
  const { html } = renderMarkdown(`---
images:
  profile: ./profile.png
regions:
  main:
    sections:
      - summary
  sidebar:
    sections:
      - profile-picture
---
@hidden ## Profile picture {.profile-picture}

:::block{role=profile-image}
@image profile
:::

## Summary {.summary}

Main content
`);

  expect(html.includes("Profile picture")).toBe(false);
  const sidebarIndex = html.indexOf('data-region="sidebar"');
  const sidebarSection = html.slice(sidebarIndex);
  expect(sidebarSection.includes("<h2")).toBe(false);
  expect(sidebarSection).toContain("profile.png");
});

it("falls back to the main region for sections with no matching id", () => {
  const { html } = renderMarkdown(`---
regions:
  sidebar:
    sections:
      - contact
---
## Untagged Section

Untagged content
`);

  expect(html).toContain('data-region="main"');
  expect(html.includes('data-region="sidebar"')).toBe(false);
});
