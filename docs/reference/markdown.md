# Markdown

Markdown Resume documents are standard [CommonMark](https://commonmark.org/)
Markdown (parsed by [markdown-it](https://github.com/markdown-it/markdown-it))
plus a small marker syntax layered on top for resume-specific structure:
blocks, dates, icons, images, and hidden content. Anything that isn't one of
the markers below is just regular Markdown.

## Headings and sections

- `#` (H1) — the document title.
- `##` (H2) — starts a new **section**. A `{.id}` suffix on the heading
  gives the section an explicit id, used to place it in a
  [region](#regions) (see [YAML → regions](/reference/yaml#regions)):

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
[YAML → regions](/reference/yaml#regions).
:::

## Custom fields

Inside a block, `@fieldname text` renders a labeled field:

```md
:::block{role=title}
@subtitle Senior Data Scientist
:::
```
→ `<div class="resume-field resume-field--subtitle">Senior Data Scientist</div>`

Which field names are recognized is configured in frontmatter via
`custom.field` (defaults to `title`, `subtitle`, `summary` — see
[YAML → custom.field](/reference/yaml#custom-field)). Using `@something` that
isn't in that list, and isn't one of the built-in directives below, is
flagged as an unknown marker.

## Built-in directives

### `@date`

```md
@date Nov 2024 – Present
@date:article 01/11/2023 – Nov 2024
```

Parses the value (up to a `|`, en dash, em dash, or line end) as one of
`dd/MM/yyyy`, `MMM yyyy`, or `yyyy-MM-dd`, then formats it with
`date.formats.<key>` or `date.default` from frontmatter (see
[YAML → date](/reference/yaml#date)). `today`/`present` (any case) pass
through unchanged. Values that don't parse (e.g. a bare year, or a whole
"2018 – 2021" range) render as-is — a bare `yyyy` is deliberately *not*
parsed, since reformatting it would fabricate a fake month/day.

### `@icon`

```md
- @icon location-dot | Zurich, Switzerland
- @icon:fa envelope | hello@example.com
@icon screenshot_monitor
```

`@icon name` (no provider) renders an icon-font span
(`material-symbols-outlined`, `data-icon="name"`) — pair it with a webfont
stylesheet listed in frontmatter `icons`. `@icon:provider name` renders an
`<img>` from a CDN, where `provider` is `fa` (Font Awesome) or `feather`
(Feather Icons) — see [YAML → icons](/reference/yaml#icons). The optional
`| text` renders alongside the icon; without it, just the icon renders. Works
both as a standalone block-level line and as list item content.

### `@image`

```md
@image profile
@image profile | Profile picture
@image:assets team/profile.png | Team photo
```

`@image key` resolves `key` against the frontmatter `images` map (see
[YAML → images](/reference/yaml#images)). `@image:bank path` resolves
through a named bank instead (`assets`, `cdn`) rather than the `images` map.
The optional `| caption` renders as a `<figcaption>`.

### `@note`

```md
@note Open to relocation.
```

Renders as a `<blockquote><p>...</p></blockquote>` — a secondary note
attached to whatever block it's in.

### `@stack`

```md
@stack Python, PyTorch, Docker
```

Comma-separated list, rendered as a badge list
(`<ul class="resume-block__stack"><li class="resume-block__stack-badge">...`).

### `@hidden`

```md
@hidden Internal note, never rendered.
- @hidden Also never rendered, as a list item.
@hidden ## Hidden section {.id}
```

Drops the line entirely from the rendered output. The one exception is a
hidden **heading** (`@hidden ## ... {.id}`), which still anchors a section
for region placement (see [Headings and sections](#headings-and-sections))
while rendering nothing.

## Validation

Rendering always runs a validation pass and reports issues (it does not stop
the render). Checked:

- an `@field` from `custom.field` with no value (empty field)
- `@date`/`@date:key` with a `key` not declared in frontmatter `date`, or
  with no value
- `@icon:provider` with a `provider` not declared in frontmatter `icons`, or
  with no icon name
- `@image key` where `key` isn't in frontmatter `images`
- any `@marker` that isn't a custom field or a built-in directive
- a section id listed in `regions.*.sections` that no heading's `{.id}`
  actually declares

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
