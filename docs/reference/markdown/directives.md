# Directives

## `@date`

```md
@date Nov 2024 – Present
@date:article 01/11/2023 – Nov 2024
```

Parses the value (up to a `|`, en dash, em dash, or line end) as one of
`dd/MM/yyyy`, `MMM yyyy`, or `yyyy-MM-dd`, then formats it with
`date.formats.<key>` or `date.default` from frontmatter (see
[YAML → date](/reference/frontmatter-config#date)). `today`/`present` (any case) pass
through unchanged. Values that don't parse (e.g. a bare year, or a whole
"2018 – 2021" range) render as-is — a bare `yyyy` is deliberately *not*
parsed, since reformatting it would fabricate a fake month/day.

## `@icon`

```md
- @icon location-dot | Zurich, Switzerland
- @icon:fa envelope | hello@example.com
@icon screenshot_monitor
```

`@icon name` (no provider) renders an icon-font span
(`material-symbols-outlined`, `data-icon="name"`) — pair it with a webfont
stylesheet listed in frontmatter `icons`. `@icon:provider name` renders an
`<img>` from a CDN, where `provider` is `fa` (Font Awesome) or `feather`
(Feather Icons) — see [YAML → icons](/reference/frontmatter-config#icons). The optional
`| text` renders alongside the icon; without it, just the icon renders. Works
both as a standalone block-level line and as list item content.

## `@image`

```md
@image profile
@image profile | Profile picture
@image:assets team/profile.png | Team photo
```

`@image key` resolves `key` against the frontmatter `images` map (see
[YAML → images](/reference/frontmatter-config#images)). `@image:bank path` resolves
through a named bank instead (`assets`, `cdn`) rather than the `images` map.
The optional `| caption` renders as a `<figcaption>`.

## `@note`

```md
@note Open to relocation.
```

Renders as a `<blockquote><p>...</p></blockquote>` — a secondary note
attached to whatever block it's in.

## `@stack`

```md
@stack Python, PyTorch, Docker
```

Comma-separated list, rendered as a badge list
(`<ul class="resume-block__stack"><li class="resume-block__stack-badge">...`).

## `@hidden`

```md
@hidden Internal note, never rendered.
- @hidden Also never rendered, as a list item.
@hidden ## Hidden section {.id}
```

Drops the line entirely from the rendered output. The one exception is a
hidden **heading** (`@hidden ## ... {.id}`), which still anchors a section
for region placement (see
[Headings and sections](/reference/markdown/#headings-and-sections))
while rendering nothing.
