# Frontmatter Config

Frontmatter block enables page configuration. In every markdown file you can you defaults configuration topics that predict style, behavior and meta. 

Example usage:

```md
---
lang: en
images:
  profile: ./assets/profile.png
---

# Jane Doe {.name}
...
```

This page documents every key the renderer actually reads. Keys not listed
here (`template`, `page`, `class_prefix`, `render`, ...) may appear in
example frontmatter for readability/future use, but nothing currently
consumes them — they're inert.

## `lang`

Type: `string`, default `en`. Used as the generated document's
`<html lang="...">`.

```yaml
lang: fr
```

## `custom.field`

Type: `string[]`, default `[title, subtitle, summary]`. Declares which
`@fieldname` markers render as [custom fields](/reference/markdown/custom-fields)
(`<div class="resume-field resume-field--name">`). Any `@marker` not in this
list, and not a built-in directive (`@date`/`@icon`/`@image`/`@note`/`@stack`/`@hidden`),
is flagged by validation as unknown.

```yaml
custom:
  field:
    - title
    - subtitle
    - summary
    - org
    - meta
    - links
```

## `date`

Type: object, or a list of single-key objects — both forms are accepted.
Configures [`@date:key`](/reference/markdown/directives#date) formatting. The special
key `default` sets the format used when no `:key` is given.

```yaml
date:
  default: MMM yyyy
  article: dd MMM yyyy
```
or equivalently:
```yaml
date:
  - default: MMM yyyy
  - article: dd MMM yyyy
```

Format tokens are normalized before being handed to
[date-fns](https://date-fns.org/): `mm` → `MMM`, `YYYY` → `yyyy`,
`YY` → `yy`.

## `images`

Type: `object` mapping a key to a path/URL. Resolved by
[`@image key`](/reference/markdown/directives#image).

```yaml
images:
  profile: ./assets/profile.png
  banner: ./assets/banner.jpg
```

## `icons`

Type: `object`, or a list of single-key objects, mapping a provider name
(`fa`, `feather`) to something — used **only to validate** that
`@icon:provider` references a declared provider. The value itself isn't read
by the icon renderer; `fa`/`feather` icon URLs come from a fixed CDN pattern
in code, not from this config.

```yaml
icons:
  - fa:
      - https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css
  - feather:
      - https://cdn.jsdelivr.net/npm/feather-icons@4.29.2/dist/feather.min.js
```

::: warning `icons` is not also a stylesheet list
The CLI separately injects `<link rel="stylesheet">` tags from
`stylesheets`/`icons`/`icon`/`fonts`/`font` frontmatter keys, but only when
their value is a **flat string or string array**. The nested
provider-map shape above (needed for `@icon:provider` validation) does not
get picked up as stylesheet links — so a webfont CSS URL nested under
`icons.fa` won't be injected automatically. Put webfont/icon-font
stylesheets under `stylesheets` (or a flat `icons: [url, ...]`) instead if
you need them linked into the page.
:::

## `fonts` / `stylesheets` / `icon` / `font`

Type: `string | string[]`. Flat lists of stylesheet/font URLs the CLI
injects as `<link rel="stylesheet">` tags in the generated HTML.

```yaml
fonts:
  - https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap
stylesheets:
  - ./theme/custom.css
```

## `single_page`

Type: `boolean`, default `false`. Set to `true` to have the CLI estimate the
content height against the configured `page.size` (default `A4`) and warn on
stdout if it overflows a single physical page.

```yaml
single_page: true
```

## `regions`

Type: `object` keyed by region name (conventionally `header`/`main`/`sidebar`/`footer`,
though any name works), each with a `sections: string[]` list of section
ids. Groups top-level `##` sections into `<div data-region="...">` wrappers,
in `header, main, sidebar, footer` order (any other region names sorted
after). A section id not listed under any region falls back to `main`.
Within a region, sections render in the **order listed here**, not source
order — a section not listed at all is appended after the listed ones, in
source order.

```yaml
regions:
  main:
    sections: [name, summary, experience, projects]
  sidebar:
    sections: [profile-picture, contact, skills, education]
```

A section's id comes from its heading's `{.id}` suffix (see
[Markdown → headings and sections](/reference/markdown/#headings-and-sections)),
including hidden headings (`@hidden ## ... {.id}`). If a `regions.*.sections`
entry names an id no heading actually declares, validation flags it as a
missing section.

If frontmatter has no `regions` key at all, sections render in plain source
order with no region wrappers.
