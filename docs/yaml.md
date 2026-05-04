# YAML front matter documentation

## Purpose

The YAML block is the **document configuration layer**.

Use it for:

* template selection
* global asset registration
* page-level document settings
* region enablement and section assignment
* renderer options
* metadata not meant to appear as content

Do **not** use YAML for:

* visual styling
* colors
* spacing
* typography
* region widths
* region heights
* actual resume body content

Those belong in CSS and Markdown.

---

# Basic form

```yaml
---
template: resume
icons: https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
---
```

It must appear at the top of the file.

---

# Recommended YAML keys

I would split them into:

* document
* assets
* page
* regions
* rendering
* metadata

---

# 1. Document keys

These describe the document as a whole.

## `template`

### Purpose

Chooses the rendering template.

### Type

`string`

### Example

```yaml
template: resume
```

### Notes

Typical values:

* `resume`
* `poster-cv`
* `ats-resume`
* `portfolio-cv`

---

## `lang`

### Purpose

Document language.

### Type

`string`

### Example

```yaml
lang: en
```

---

# 2. Asset keys

These define external resources used by the renderer.

## `icons`

### Purpose

Defines the icon font or icon stylesheet source.

### Type

`string | string[]`

### Example

```yaml
icons: https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
```

or

```yaml
icons:
  - https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
  - https://example.com/custom-icons.css
```

### Notes

Useful when using `@icon`.

---

## `fonts`

### Purpose

Defines external fonts to load.

### Type

`string[]`

### Example

```yaml
fonts:
  - https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap
  - https://fonts.googleapis.com/css2?family=Playwrite+IE:wght@100..400&display=swap
```

---

## `stylesheets`

### Purpose

Additional external CSS files.

### Type

`string[]`

### Example

```yaml
stylesheets:
  - ./theme/custom.css
```

### Notes

Optional. Use this only when the document needs extra stylesheet files beyond the template and the renderer’s default CSS.

---

## `scripts` *(optional / not necessarily implemented)*

### Purpose

Optional external scripts if the renderer allows them.

### Type

`string[]`

### Example

```yaml
scripts:
  - ./renderer/helpers.js
```

### Notes

Often disabled in secure renderers.

---

## `images`

### Purpose

Registers named image assets that can be referenced from Markdown.

### Type

`object`

### Example

```yaml
images:
  avatar: ./assets/john-doe.png
  banner: ./assets/banner.jpg
  dashboard: ./assets/dashboard.png
```

### Markdown reuse

Inside Markdown:

```md
@image avatar
```

or:

```md
:::image
banner
:::
```

### Resolution rule

When the renderer sees an image reference:

1. if the value matches a key in `images`, resolve it to that path
2. otherwise treat it as a literal path or URL

### Notes

This is cleaner than repeating file paths throughout the Markdown.

---

# 3. Page keys

These define document-level page settings.

## `page`

### Purpose

Page-level document config.

### Type

`object`

### Example

```yaml
page:
  size: A4
  margin: 0
```

### Common subkeys

* `size`
* `margin`

### Notes

These are document/export settings, not styling tokens.

---

# 4. Region keys

These define **region availability** and **default section-to-region assignment**.

## Section definition

A **section** is a semantic content group introduced by a level-2 Markdown heading (`##`).

Example:

```md
## Experience
```

This creates a section with:

* title: `Experience`
* id: `experience`

The section id is derived from the heading text by normalization, typically:

* lowercase
* trim whitespace
* replace spaces with `-`
* remove punctuation except `-`

Example:

```md
## Soft Skills
```

becomes:

```text
soft-skills
```

A section continues until the next `##` heading or the end of the document.

Blocks inside a section belong to that section.

---

## `regions`

### Purpose

Configures regions and assigns **sections** to them by default.

### Type

`object`

### Notes

Built-in regions are:

* `header`
* `main`
* `sidebar`
* `footer`

These regions always exist logically.

YAML does **not** define sections.
Sections are created by Markdown `##` headings.

YAML only defines:

* whether a region is enabled
* which section ids belong to that region by default

### Example

```yaml
regions:
  header:
    enabled: true
  main:
    enabled: true
    sections: [summary, experience, projects]
  sidebar:
    enabled: true
    sections: [education, skills, languages]
  footer:
    enabled: true
    sections: [interests]
```

In this example:

* the `summary`, `experience`, and `projects` sections render in `main`
* the `education`, `skills`, and `languages` sections render in `sidebar`
* the `interests` section renders in `footer`

If a section is not assigned to any region, it should default to `main`.

---

## `regions.<name>.enabled`

### Purpose

Enable or disable a region.

### Type

`boolean`

### Example

```yaml
regions:
  sidebar:
    enabled: true
```

---

## `regions.<name>.sections`

### Purpose

Assigns **section ids** to a region.

### Type

`string[]`

### Example

```yaml
regions:
  sidebar:
    sections:
      - education
      - skills
      - languages
```

### Notes

Section ids must match the normalized ids derived from Markdown `##` headings.

For example:

```md
## Education
## Skills
## Languages
```

correspond to:

```text
education
skills
languages
```

---

## Section region resolution

A section’s region is resolved in this order:

1. explicit section-level region, if your syntax later supports one
2. YAML `regions.<name>.sections`
3. default fallback to `main`

### Example

Markdown:

```md
## Education
:::entry{kind=education}
...
:::
```

YAML:

```yaml
regions:
  sidebar:
    sections:
      - education
```

Result:

* the `education` section is assigned to `sidebar`
* blocks inside that section inherit `sidebar` unless they explicitly override their own region

---

## Block and section assignment to regions

Sections are assigned to regions by YAML.

Blocks inherit the region of their section by default.

A block may explicitly override its region in Markdown.

### Markdown examples

Assign a block to the header:

```md
:::hero{region=header}
...
:::
```

Assign a container to the footer:

```md
:::container{region=footer}
...
:::
```

Assign a block to the sidebar:

```md
:::container{region=sidebar}
...
:::
```

### Notes

* YAML assigns **sections** to regions by default
* Markdown may assign **individual blocks** to regions explicitly
* explicit block region overrides inherited section region
* any section or block may target any region

---

## Content before the first section

Content that appears before the first `##` heading is not part of a named section.

A parser may handle this as:

* document-level content, or
* a synthetic root section such as `__root__`

Blocks in this area may still explicitly target regions such as `header`.

Example:

```md
# John Doe

:::hero{region=header}
...
:::
```

---

## Region assignment conflicts

A section should belong to only one region by default.

This is invalid:

```yaml
regions:
  main:
    sections: [education]
  sidebar:
    sections: [education]
```

Note:
* in strict mode: raise an error
* in non-strict mode: warn and use first match

---

# 5. Rendering keys

These control how the renderer behaves.

## `render`

### Purpose

Renderer settings.

### Type

`object`

### Example

```yaml
render:
  icons_enabled: true
  html_passthrough: false
  markdown_in_blocks: true
  allow_nested_blocks: true
```

### Common subkeys

* `icons_enabled`
* `markdown_in_blocks`
* `allow_nested_blocks`
* `normalize_whitespace`
* `strict_mode`

---

## `render.icons_enabled`

### Purpose

Enables icon processing such as `@icon`.

### Type

`boolean`

### Example

```yaml
render:
  icons_enabled: true
```

---

## `render.markdown_in_blocks`

### Purpose

Controls whether Markdown is parsed normally inside custom blocks.

### Type

`boolean`

### Example

```yaml
render:
  markdown_in_blocks: true
```

---

## `render.allow_nested_blocks`

### Purpose

Controls whether blocks may contain nested blocks.

### Type

`boolean`

### Example

```yaml
render:
  allow_nested_blocks: true
```

---

## `render.normalize_whitespace`

### Purpose

Controls whether whitespace is normalized during parsing/rendering.

### Type

`boolean`

### Example

```yaml
render:
  normalize_whitespace: true
```

---

## `render.strict_mode`

### Purpose

Controls whether the renderer/parser should enforce stricter validation.

### Type

`boolean`

### Example

```yaml
render:
  strict_mode: false
```

---

## `class_prefix`

### Purpose

Prefix for generated CSS classes.

### Type

`string`

### Example

```yaml
class_prefix: resume
```

### Notes

If set to `cv`, the renderer might emit classes like:

* `cv-grid`
* `cv-entry`
* `cv-list`

This is useful when:

* integrating into a larger site
* avoiding CSS collisions
* supporting multiple rendering namespaces

---

# 6. Metadata keys

These store information not necessarily rendered directly.

## `meta`

### Purpose

Freeform document metadata.

### Type

`object`

### Example

```yaml
meta:
  author: John Doe
  version: 1
  created_at: 2026-04-03
```

---

## `exports`

### Purpose

Export targets/configuration.

### Type

`object`

### Example

```yaml
exports:
  html: true
  pdf: true
  png: false
```

---

# 7. Suggested “official” YAML schema

Here is the recommended high-level structure:

```yaml
---
template: resume
lang: en

icons: https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
fonts:
  - https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap

images:
  avatar: ./assets/john-doe.png
  banner: ./assets/banner.jpg

page:
  size: A4
  margin: 0

regions:
  header:
    enabled: true
  main:
    enabled: true
  sidebar:
    enabled: true
    sections:
      - education
      - skills
      - languages
  footer:
    enabled: true

render:
  icons_enabled: true
  html_passthrough: false
  markdown_in_blocks: true
  allow_nested_blocks: true

class_prefix: resume

meta:
  version: 1
---
```

---

# 8. What YAML should contain vs not contain

## Good things for YAML

* template name
* loaded fonts/icons
* asset registries
* page-level document settings
* region enablement
* section-to-region assignment
* renderer options
* metadata

## Bad things for YAML

* colors
* spacing
* typography
* region widths
* region heights
* actual work experience descriptions
* project bullet points
* summary body text
* interests content
* education items

Those belong in CSS and Markdown.

---

# 9. Recommended documentation by key

Here is the concise key-style documentation.

## `template`

* type: `string`
* purpose: choose template
* example:

  ```yaml
  template: resume
  ```

## `lang`

* type: `string`
* purpose: document language
* example:

  ```yaml
  lang: en
  ```

## `icons`

* type: `string | string[]`
* purpose: icon stylesheet URL(s)
* example:

  ```yaml
  icons: https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:...
  ```

## `fonts`

* type: `string[]`
* purpose: font stylesheet URLs
* example:

  ```yaml
  fonts:
    - https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap
  ```

## `stylesheets`

* type: `string[]`
* purpose: optional external stylesheet URLs or paths
* example:

  ```yaml
  stylesheets:
    - ./theme/custom.css
  ```

## `images`

* type: `object`
* purpose: named image registry
* example:

  ```yaml
  images:
    avatar: ./assets/john-doe.png
    banner: ./assets/banner.jpg
  ```

## `page`

* type: `object`
* purpose: page-level document settings
* example:

  ```yaml
  page:
    size: A4
    margin: 0
  ```

## `regions`

* type: `object`
* purpose: region configuration and section assignment
* example:

  ```yaml
  regions:
    sidebar:
      enabled: true
      sections:
        - education
        - skills
  ```

## `render`

* type: `object`
* purpose: renderer behavior flags
* example:

  ```yaml
  render:
    icons_enabled: true
    allow_nested_blocks: true
  ```

## `class_prefix`

* type: `string`
* purpose: CSS class namespace prefix
* example:

  ```yaml
  class_prefix: resume
  ```

## `meta`

* type: `object`
* purpose: free metadata
* example:

  ```yaml
  meta:
    version: 1
  ```

## `exports`

* type: `object`
* purpose: export targets/configuration
* example:

  ```yaml
  exports:
    pdf: true
  ```

---

# 10. Practical rules

## Rule 1

YAML is for **global config**, not body content.

## Rule 2

If a value changes from one block to another, it probably belongs in a block attribute or directive, not YAML.

## Rule 3

If a value affects the whole document or renderer, it belongs in YAML.

## Rule 4

Unknown YAML keys should be preserved, not discarded.

## Rule 5

Use `images` as a named asset registry instead of hardcoding image paths in Markdown when possible.

## Rule 6

Treat `sidebar` exactly like `header`, `main`, and `footer`: it is a region.

## Rule 7

Any section or block may target any region explicitly with `region=<name>`.

## Rule 8

Visual behavior belongs in CSS, not YAML.

---

# 11. Best minimal YAML for your current CV

For your poster-style CV, I would recommend:

```yaml
---
template: resume
lang: en

icons: https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200
fonts:
  - https://fonts.googleapis.com/css2?family=Montserrat:wght@100..900&display=swap

images:
  avatar: ./assets/john-doe.png
  banner: ./assets/banner.jpg

page:
  size: A4
  margin: 0

regions:
  header:
    enabled: true
  main:
    enabled: true
  sidebar:
    enabled: false
  footer:
    enabled: true

render:
  icons_enabled: true
  html_passthrough: false
  allow_nested_blocks: true
---
```

That is enough for most of your current system.
