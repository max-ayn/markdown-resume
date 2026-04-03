Yes — here is a clean reference list for the current convention system.

I’ll separate it into:

* block types
* list/widget blocks
* entry/meta directives
* common attributes
* what each block may contain

---

# 1. Common block attributes

These attributes can be used on almost any block unless noted otherwise.

## Common attributes

* `region`
* `variant`
* `role`
* `class`

## Meaning

### `region`

Where the block should be rendered in the layout.

Examples:

* `header`
* `main`
* `sidebar`
* `footer`

Example:

```md id="h11v3t"
:::container{region=header}
...
:::
```

### `variant`

Visual/rendering style hint.

Examples:

* `compact`
* `accent`
* `timeline-card`
* `boxed-icons`

Example:

```md id="3167m0"
:::entry{kind=job variant=timeline-card}
...
:::
```

### `role`

Semantic/contextual purpose.

Examples:

* `interests`
* `languages`
* `panel`
* `presentation`
* `service-grid`

Example:

```md id="vhx1ha"
:::list{role=interests variant=boxed-icons}
...
:::
```

### `class`

Additional CSS hook.

Example:

```md id="vfg5r0"
:::container{class=custom-highlight}
...
:::
```

## Extra custom attributes

Any extra attribute is allowed and should go into `props`.

Example:

```md id="v9xks2"
:::image{width=24mm align=right}
./assets/me.png
:::
```

---

# 2. Core blocks

These are the main built-in semantic blocks.

---

## `entry`

### Purpose

Structured resume item.

### Common use cases

* job
* education
* project
* service
* certification
* profile

### Common attributes

* `kind`
* `variant`
* `region`
* `role`
* `class`
* custom props
* optionally `icon`

### Typical inner content

* `### Title`
* `@meta`
* `@date`
* `@org`
* `@summary`
* `@links`
* `@image`
* `@stack`
* bullet list
* nested Markdown
* optionally nested blocks if your parser allows it

### Example

```md id="xc0vlh"
:::entry{kind=job variant=timeline-card}
@date 2020 - 2022
@org Webmart
### UI/UX
@summary Lorem ipsum...
:::
```

---

## `lead`

### Purpose

Primary intro text.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* plain text
* inline Markdown

### Example

```md id="ev1d9h"
:::lead
UX/UI Designer
:::
```

---

## `note`

### Purpose

Secondary supporting text.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* plain text
* inline Markdown

### Example

```md id="j6tnuo"
:::note
Open to remote work and relocation.
:::
```

---

## `contact`

### Purpose

Structured contact list.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* list items
* list items may use `@icon`

### Supported item form

```text
- @icon <icon_name> | <text>
- plain text
- [link](...)
```

### Example

```md id="jxxegq"
:::contact
- @icon mail | hello@example.com
- @icon public | example.com
:::
```

---

## `image`

### Purpose

Standalone media block.

### Common attributes

* `variant`
* `region`
* `role`
* `class`
* `alt`
* custom props like `width`, `height`, `align`, `fit`

### Inner content

* image path or URL

### Example

```md id="a8o4ky"
:::image{variant=avatar alt="Portrait of John Doe"}
./assets/john-doe.png
:::
```

---

## `list`

### Purpose

Generic list block.

### Replaces

* plain factual lists
* tag/chip lists
* interest lists
* language lists

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* bullet items
* items may optionally use `@icon`

### Common variants

* `plain`
* `tags`
* `boxed-icons`

### Example

```md id="ou1hpo"
:::list{role=interests variant=boxed-icons}
- @icon music_note_2 | Music
- @icon photo_camera | Photography
:::
```

---

## `group-list`

### Purpose

Label/value grouped list.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* bullet items with label/value pattern

### Recommended item form

```text
- **Languages:** JavaScript, Python
- **Frontend:** React, Angular
```

### Example

```md id="rlnppj"
:::group-list
- **Languages:** JavaScript, Python
- **Frontend:** React, Angular
:::
```

---

## `quote`

### Purpose

Quoted statement or testimonial.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* text
* inline Markdown

### Example

```md id="u9zbg1"
:::quote
Design is intelligence made visible.
:::
```

---

## `callout`

### Purpose

Highlighted important note.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* text
* inline Markdown
* optionally nested content if your parser allows it

### Example

```md id="k8jzp5"
:::callout{variant=accent}
Available for freelance work.
:::
```

---

## `container`

### Purpose

Generic wrapper/group.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* nested blocks
* headings
* Markdown
* lists
* mixed content

### Example

```md id="cch2pz"
:::container{role=panel variant=accent}
## Education
...
:::
```

---

## `divider`

### Purpose

Structural separator.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* usually empty

### Example

```md id="g297ut"
:::divider
:::
```

---

## `code`

### Purpose

Escape hatch for raw code.

### Common attributes

* `lang`
* `variant`
* `region`
* `role`
* `class`

### Inner content

* raw code
* HTML, SVG, CSS, etc.

### Example

```md id="wy4wd7"
:::code{lang=html}
<div class="custom-badge">Open to relocation</div>
:::
```

---

# 3. Standard widget blocks

These are reusable widgets with special parsing behavior.

---

## `icon-list`

### Purpose

Badge/rating list.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* bullet items with `label | rating`

### Item format

```text
- Ps | ●●●●○
- Ai | ●●●○○
```

### Example

```md id="gf2pcp"
:::icon-list
- Ps | ●●●●○
- Ai | ●●●●○
:::
```

---

## `meter-list`

### Purpose

Progress/skill bars.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* bullet items with `label | number`

### Item format

```text
- CSS | 90
- JavaScript | 70
```

### Example

```md id="dzyn4x"
:::meter-list
- CSS | 90
- JavaScript | 70
:::
```

---

# 4. Optional layout/template blocks

These are useful aliases or template blocks, but not necessarily core.

---

## `hero`

### Purpose

Top banner / top visual intro area.

### Common attributes

* `region`
* `variant`
* `role`
* `class`

### Inner content

* nested blocks
* usually `profile`, `contact`, `image`, `lead`, `note`

### Example

```md id="82fol1"
:::hero{region=header}
...
:::
```

---

## `profile`

### Purpose

Profile intro grouping block.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* `# Name`
* `lead`
* `note`
* other intro content

### Example

```md id="1mjlwm"
:::profile
# John Doe
:::lead
UX/UI Designer
:::
:::
```

---

## `grid`

### Purpose

Generic layout grid.

### Common attributes

* `cols`
* `variant`
* `region`
* `role`
* `class`

### Inner content

* nested `container`
* nested blocks
* headings

### Example

```md id="m4mjlwm"
:::grid{cols=2 role=presentation}
...
:::
```

---

## `column`

If you keep `column` as a dedicated alias.

### Purpose

Grid child / column wrapper.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* nested blocks

### Example

```md id="mnuzdv"
:::column
...
:::
```

You can also replace it with:

```md id="8tg2mt"
:::container{role=column}
...
:::
```

---

## `panel`

If you keep `panel` as a dedicated alias.

### Purpose

Card/panel wrapper.

### Common attributes

* `variant`
* `region`
* `role`
* `class`

### Inner content

* nested blocks

### Example

```md id="0b6pt2"
:::panel{variant=accent}
...
:::
```

You can also replace it with:

```md id="of4ez4"
:::container{role=panel variant=accent}
...
:::
```

---

# 5. Entry meta directives

These are directives used inside `entry`.

---

## `@meta`

### Purpose

General metadata line.

### Example

```md id="6j0nfl"
@meta Nov 2024 – Present | St. Gallen, Switzerland
```

### Best for

* generic subtitle/meta line
* date + location when you do not need structured split

---

## `@date`

### Purpose

Structured date field.

### Example

```md id="53fvwd"
@date 2020 - 2022
```

### Best for

* timeline cards
* timeline layouts
* explicit date field rendering

---

## `@org`

### Purpose

Organization/company/school name.

### Example

```md id="4stj0x"
@org Webmart
```

### Best for

* timeline cards
* education/work split meta layout

---

## `@summary`

### Purpose

Short summary text.

### Example

```md id="zpjlwm"
@summary Lorem ipsum dolor sit amet...
```

---

## `@links`

### Purpose

Link line.

### Example

```md id="z8sxbn"
@links Portfolio: [example.com](https://example.com)
```

---

## `@image`

### Purpose

Image attached to the entry.

### Example

```md id="axxh0q"
@image ./assets/project.png
```

---

## `@stack`

### Purpose

Comma-separated technologies/keywords.

### Example

```md id="8cspiu"
@stack React, Angular, Node.js
```

---

# 6. Inline item micro-syntax

These are not full blocks, but item-level conventions.

---

## `@icon`

### Purpose

Attach an icon to a list item.

### Syntax

```text
@icon <icon_name> | <content>
```

### Example

```md id="oaxvpe"
- @icon mail | hello@example.com
```

### Usable inside

* `contact`
* `list`
* optionally `fact-list` if you still keep it
* maybe future widgets

---

# 7. What each block can contain

Here is the practical matrix.

## `entry`

Can contain:

* `###`
* `@meta`
* `@date`
* `@org`
* `@summary`
* `@links`
* `@image`
* `@stack`
* bullet lists
* paragraphs
* inline Markdown
* optionally nested blocks

## `lead`

Can contain:

* text
* inline Markdown

## `note`

Can contain:

* text
* inline Markdown

## `contact`

Can contain:

* bullet list items
* `@icon`
* inline Markdown links

## `image`

Can contain:

* single image path/URL

## `list`

Can contain:

* bullet list items
* optional `@icon` item syntax

## `group-list`

Can contain:

* bullet items with label/value structure

## `quote`

Can contain:

* text
* inline Markdown

## `callout`

Can contain:

* text
* inline Markdown
* optionally nested content

## `container`

Can contain:

* anything block-like
* headings
* lists
* nested blocks
* paragraphs

## `divider`

Can contain:

* usually nothing

## `code`

Can contain:

* raw code text

## `icon-list`

Can contain:

* bullet items with `label | rating`

## `meter-list`

Can contain:

* bullet items with `label | percentage`

## `hero`

Can contain:

* nested blocks
* usually `profile`, `contact`, `image`

## `profile`

Can contain:

* `# heading`
* `lead`
* `note`
* paragraphs

## `grid`

Can contain:

* nested blocks
* typically columns/containers

---

# 8. Suggested minimal “official” set

If you want a compact official standard:

## Core blocks

* `entry`
* `lead`
* `note`
* `contact`
* `image`
* `list`
* `group-list`
* `quote`
* `callout`
* `container`
* `divider`
* `code`

## Standard widgets

* `icon-list`
* `meter-list`

## Optional layout aliases

* `hero`
* `profile`
* `grid`
* `column`
* `panel`

## Entry directives

* `@meta`
* `@date`
* `@org`
* `@summary`
* `@links`
* `@image`
* `@stack`

## Inline micro-syntax

* `@icon`

---

# 9. Short cheat sheet

## Blocks

* `entry`: structured resume item
* `lead`: primary intro line
* `note`: supporting text
* `contact`: contact list
* `image`: standalone image
* `list`: generic list
* `group-list`: labeled groups
* `quote`: quotation
* `callout`: emphasized note
* `container`: generic wrapper
* `divider`: separator
* `code`: raw code
* `icon-list`: badge + rating list
* `meter-list`: progress bars
* `hero`: top banner
* `profile`: intro wrapper
* `grid`: layout grid

## Common attrs

* `region`
* `variant`
* `role`
* `class`

## Entry attrs

* `kind`
* `icon`
* plus common attrs

## Entry directives

* `@meta`
* `@date`
* `@org`
* `@summary`
* `@links`
* `@image`
* `@stack`

## Item syntax

* `@icon name | text`

If you want, I can turn this into a **Markdown spec table** or a **TypeScript type definition** next.
