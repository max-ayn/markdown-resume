# Markdown

Markdown Resume documents are standard [CommonMark](https://commonmark.org/)
Markdown (parsed by [markdown-it](https://github.com/markdown-it/markdown-it))
plus a small marker syntax layered on top for resume-specific structure:
blocks, dates, icons, images, and hidden content. Anything that isn't one of
the markers below is just regular Markdown.

- [Custom fields](/reference/markdown/custom-fields) — `@fieldname` labeled
  fields inside a block.
- [Directives](/reference/markdown/directives) — `@date`, `@icon`, `@image`,
  `@note`, `@stack`, `@hidden`.
- [Validation](/reference/markdown/validation) — every issue the renderer can
  report.

## Headings and sections

- `#` (H1) — the document title.
- `##` (H2) — starts a new **section**. A `{.id}` suffix on the heading
  gives the section an explicit id, used to place it in a
  [region](#regions) (see [YAML → regions](/reference/frontmatter-config#regions)):

  ```md
  ## Experience {.experience}
  ```

  Without a `{.id}` suffix, the heading still renders normally; it just has
  no id to match against `regions.*.sections`, so its section falls back to
  the `main` region.
- `###`+ inside a `:::block{...}` — a normal heading, commonly used as a
  block's title (job title, project name, ...). It does **not** start a new
  section — only `##` does.
- `@hidden ## Heading {.id}` — a **hidden section heading**: it renders
  nothing (no `<h2>` at all), but its `{.id}` still anchors the section for
  region placement. Use this for structural sections you want laid out but
  not titled (e.g. a sidebar profile picture "section").

A section runs from its `##` heading up to (but not including) the next `##`
heading, or the end of the document.

## Blocks

`:::block{...}` is the one structural container:

```md
:::block{kind=job role=experience}
### Senior Engineer — Acme Corp
@date Nov 2024 – Present
@org Acme Corp
- Shipped the thing.
:::
```

- The name right after `:::` (`block` above) becomes a CSS class, alongside
  the always-present `resume-block` class.
- `.foo` inside `{...}` adds the literal class `foo`. **This is how you add
  a custom class** — there is no `class=` attribute key.
- `key=value` pairs are otherwise emitted as `data-key="value"` attributes,
  with two special-cased keys:
  - `role=X` → adds class `resume-block--X` **and** sets `data-region="X"`
  - `kind=X` → adds class `resume-block--X` (in addition to `data-kind="X"`)
- Blocks may be nested (a `:::block{...}` inside another).

```md
:::block{kind=job role=experience .highlight width=24mm}
...
:::
```
renders as
```html
<div class="resume-block block resume-block--experience resume-block--job highlight" data-region="experience" data-kind="job" data-width="24mm">
```

::: tip Region placement is section-level only
`role=`/`region=` on a block only ever produce a `data-region` attribute for
styling — they do **not** move the block into a different top-level region
wrapper. Which `<div data-region="main">`/`<div data-region="sidebar">` a
block ends up inside is decided entirely by its **section's** `##` heading
id and the frontmatter `regions.*.sections` map. See
[YAML → regions](/reference/frontmatter-config#regions).
:::

## Embedded styles

Since `markdown-it` parses with `html: true`, a raw `<style>` block anywhere
in the document is passed straight through into the rendered HTML — no
external `.css` file is required. Multiple `<style>` blocks are all kept, so
you can split rules across the document if you want.

```md
# Jane Doe {.name}

<style>
.name { color: teal; }
</style>
```

An external stylesheet (auto-discovered `.css` file, or `-style <path>`) is
still supported and applies **in addition to** any embedded `<style>` —
they're not mutually exclusive. See [CLI reference → Render](/guide/getting-started#render).

## Full example

```md
---
custom:
  field: [title, subtitle, summary, org, meta]
date:
  default: MMM yyyy
images:
  profile: ./assets/profile.png
regions:
  main:
    sections: [name, summary, experience]
  sidebar:
    sections: [profile-picture, contact]
---

## Jane Doe {.name}

@hidden ## Profile picture {.profile-picture}

:::block{role=profile-image}
@image profile
:::

## Contact {.contact}

:::block{role=contact}
- @icon mail | hello@example.com
- @icon phone | +00 000 000 0000
:::

## Summary {.summary}

:::block{role=summary}
@summary Senior engineer with **6+ years** building distributed systems.
@note Open to remote roles.
:::

## Experience {.experience}

:::block{kind=job role=experience}
### Senior Engineer — Acme Corp
@date Nov 2024 – Present
@org Acme Corp
@stack Python, PyTorch, Docker
- Shipped the thing.
:::
```
