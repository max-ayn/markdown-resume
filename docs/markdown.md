# Semantic Resume Markdown Content Specification

# 1. Purpose

This specification defines the **Markdown content layer** of a resume/CV authoring format.

This content specification works together with YAML front matter:

* **YAML** = document-level configuration
* **Markdown** = content structure
* **CSS** = visual behavior

---

# 3. Core principles

## 3.1 One main content primitive

The main content primitive is:

* `block`

A block is a semantic content container that can hold:

* text
* lists
* images
* dates
* structured metadata
* nested blocks

## 3.2 Meaning comes from attributes and fields

A block’s meaning is expressed through:

* `kind`
* `role`
* `variant`
* `region`
* `class`
* inline field directives such as `@date`, `@org`, `@summary`, `@image`

## 3.3 Markdown remains readable

The source should stay readable to humans without needing to inspect the rendered HTML.

## 3.4 CSS owns visual behavior

Visual behavior belongs in CSS, not the content syntax.

The content syntax may provide rendering hints like `variant`, but not visual rules.

## 3.5 Extensibility by composition

The format should support new use cases by combining:

* `block`
* attributes
* field directives
* nested blocks

rather than by constantly inventing new block names.

## 3.6 Hidden content is preserved, not deleted

The format supports `@hidden` to preserve source content while excluding it from normal rendered output.

This allows authors and AI systems to keep alternate lines, draft content, or source-only notes in the Markdown without removing them.

Hidden content should remain in the parsed representation.

---

# 4. Core model

The content model is built from three concepts:

* **regions**
* **sections**
* **blocks**

---

# 5. Regions

A **region** is a layout destination.

Built-in regions are:

* `header`
* `main`
* `sidebar`
* `footer`

A region answers:

> where should this content be rendered?

A block may explicitly declare a region:

```md id="m3xkuz"
:::block{region=header}
...
:::
```

A section may be assigned to a region by YAML.

---

# 6. Sections

A **section** is a semantic content group introduced by a level-2 Markdown heading (`##`) or by a hidden level-2 heading (`@hidden ##`).

Example:

```md id="jn2k3w"
## Experience
```

This creates a section with:

* title: `Experience`
* id: `experience`

Section ids are derived from heading text by normalization, typically:

* lowercase
* trim whitespace
* replace spaces with `-`
* remove punctuation except `-`

Example:

```md id="1liczh"
## Soft Skills
```

becomes:

```text id="9w1b1w"
soft-skills
```

A section continues until:

* the next `##` heading (visible or hidden), or
* the end of the document

Blocks inside a section belong to that section.

---

# 7. Heading rules

## `#` H1

The first-level heading is the main document title, usually the candidate name.

Example:

```md id="vxiwqq"
# Jane Doe
```

Recommended:

* exactly one H1

---

## `##` H2

A second-level heading defines a new section.

Example:

```md id="redvda"
## Summary
## Experience
## Education
```

Hidden H2 headings are also supported:

```md
@hidden ## Interests
```

This form creates a real section with a normal section id (for example `interests`) and participates in region assignment.
Its section title is hidden in standard HTML/PDF rendering.

---

## `###` H3

Inside a block, `###` may be used as a shorthand for the block title.

Example:

```md id="g0bi4p"
:::block{kind=job}
### Software Engineer — Meteomatics
@date Nov 2024 – Present
@org Meteomatics
:::
```

Outside a block, `###` may be treated as normal Markdown.

---

# 8. Generic block syntax

## Basic form

```md id="d6q7wd"
:::block
content
:::
```

## With attributes

```md id="d5l6y5"
:::block{kind=job role=experience variant=timeline-card region=main}
content
:::
```

A block may contain:

* field directives
* paragraphs
* bullet lists
* nested blocks
* inline Markdown

---

# 9. Block attributes

A block may declare the following attributes.

## `kind`

### Purpose

Declares the block’s content kind.

Examples:

* `job`
* `project`
* `education`
* `award`
* `certification`
* `volunteering`
* `service`
* `profile`

Example:

```md id="xhbl9k"
:::block{kind=job}
...
:::
```

---

## `role`

### Purpose

Declares the block’s semantic role or contextual purpose.

Examples:

* `hero`
* `profile`
* `contact`
* `interests`
* `skills`
* `summary`
* `services`

Example:

```md id="0xmfxo"
:::block{role=contact}
...
:::
```

---

## `variant`

### Purpose

Declares a renderer hint for block style.

Examples:

* `compact`
* `timeline-card`
* `boxed-icons`
* `accent`
* `minimal`

Example:

```md id="2pkad2"
:::block{kind=job variant=timeline-card}
...
:::
```

---

## `region`

### Purpose

Overrides the block’s default region.

Examples:

* `header`
* `main`
* `sidebar`
* `footer`

Example:

```md id="a4l59m"
:::block{role=hero region=header}
...
:::
```

---

## `class`

### Purpose

Adds a custom CSS class hook.

Example:

```md id="k2512u"
:::block{class=important-note}
...
:::
```

---

## Additional attributes

Unknown attributes are allowed and should be preserved as props.

Example:

```md id="14o8no"
:::block{kind=project width=24mm align=right}
...
:::
```

---

# 10. Block content fields

Inside a block, structured fields are defined through inline directives.

These directives are the primary structured grammar of the content language.

---

## `@title`

### Purpose

Explicit title field.

### Example

```md id="v90jzn"
@title Software Engineer — Meteomatics
```

### Notes

Optional if `###` is used as shorthand.

---

## `@date`

### Purpose

Structured date field.

### Example

```md id="h8qj34"
@date Nov 2024 – Present
```

---

## `@org`

### Purpose

Organization, company, school, or institution.

### Example

```md id="o52w3j"
@org Meteomatics
```

---

## `@summary`

### Purpose

Short summary text.

### Example

```md id="3jz8jn"
@summary Built and maintained scalable weather-data applications.
```

---

## `@image`

### Purpose

Attach an image to the block.

### Example

```md id="mh0h74"
@image avatar
```

This may resolve through YAML `images`.

---

## `@links`

### Purpose

Link line or compact link metadata.

### Example

```md id="rjweme"
@links Portfolio: [example.com](https://example.com)
```

---

## `@stack`

### Purpose

Comma-separated technologies or keywords.

### Example

```md id="p4rmkx"
@stack React, Angular, FastAPI, Docker
```

---

## `@note`

### Purpose

Secondary supporting note attached to the block.

### Example

```md id="s0v1x1"
@note Open to relocation.
```

---

## `@meta`

### Purpose

General metadata line when a more specific field is not needed.

### Example

```md id="j9stfu"
@meta Nov 2024 – Present | City, Country
```

---

## `@hidden`

### Purpose

Marks content as preserved in source but excluded from normal rendered output.

### Supported uses

`@hidden` may be applied to:

* a whole block
* a field directive
* a list item
* a plain text line
* a section heading line (`@hidden ## ...`)

### Rendering rule

Hidden content must remain in the parsed representation but should be skipped in standard HTML/PDF rendering.

### Block-level example

```md id="efunx6"
:::block{kind=project}
@hidden
### Experimental Project
@summary Not shown in the final resume.
:::
```

### Field-level example

```md id="89rpnr"
:::block{kind=job}
### Software Engineer
@date Nov 2024 – Present
@org Meteomatics
@hidden @summary Draft summary kept in source only.
:::
```

### Item-level example

```md id="4qjlwm"
:::block{role=skills}
- JavaScript
- Python
- @hidden COBOL
:::
```

### Plain-line example

```md id="r8f8yu"
:::block{role=summary}
@hidden Internal note for later rewrite.
@summary Fullstack engineer with distributed systems experience.
:::
```

### Hidden section heading example

```md
@hidden ## Interests

:::block{role=interests region=footer}
- @icon photo_camera | Photography
:::
```

### Notes

`@hidden` is intended for:

* keeping source-only content
* preserving alternate phrasings
* storing draft lines
* keeping material available for AI rewriting without displaying it

---

# 11. List items inside blocks

A block may contain bullet lists.

These may represent:

* highlights
* skills
* interests
* contact items
* facts

Example:

```md id="t1g8wa"
:::block{kind=job}
### Software Engineer
- Built API services
- Improved deployment reliability
- Added automated tests
:::
```

---

## `@icon` item syntax

List items may use `@icon`:

```text id="c59mfb"
@icon <icon_name> | <content>
```

Example:

```md id="8i8udw"
- @icon mail | max@example.com
- @icon public | example.com
```

Common uses:

* contact blocks
* interests blocks
* simple feature lists

---

# 12. Nested blocks

A block may contain nested blocks if the renderer allows nesting.

Example:

```md id="8nsgkp"
:::block{role=hero region=header}
:::block{role=profile}
@title John Doe
@summary UX/UI Designer
@note Open to relocation.
:::

:::block{role=contact}
- @icon phone_enabled | +00 000 000 0000
- @icon mail | hello@example.com
:::
:::
```

This allows compositional layouts without introducing many special block names.

---

# 13. Common usage patterns

## Job entry

```md id="038ogx"
:::block{kind=job role=experience variant=timeline-card}
### Software Engineer — Meteomatics
@date Nov 2024 – Present
@org Meteomatics
@summary Built fullstack systems for weather data products.
@stack React, Angular, FastAPI, Docker, Nomad
- Developed real-time interfaces
- Improved deployment reliability
- Contributed to system architecture
:::
```

---

## Education entry

```md id="ph5m9a"
:::block{kind=education role=education}
### Master of Science — SeaTech
@date 2018 – 2021
@org SeaTech
@summary Specialization in systems, networks, and software development.
:::
```

---

## Contact block

```md id="b6cudk"
:::block{role=contact}
- @icon location_on | City, Country
- @icon mail | max@example.com
- @icon call | +00 000 000 0000
- @icon public | github.com/example
:::
```

---

## Summary block

```md id="fzjlwm"
:::block{role=summary}
@summary Fullstack Software Engineer with 5 years of experience building scalable web applications and distributed systems.
@note Open to international opportunities, relocation, and remote work.
:::
```

---

## Interests block

```md id="xxc243"
:::block{role=interests variant=boxed-icons}
- @icon music_note_2 | Music
- @icon photo_camera | Photography
- @icon sports_soccer | Football
:::
```

---

## Standalone image block

```md id="j0zwzl"
:::block{role=image region=header}
@image avatar
:::
```

---

## Hidden content pattern

```md id="r4vfvg"
:::block{kind=job role=experience}
### Software Engineer — Meteomatics
@date Nov 2024 – Present
@org Meteomatics
@summary Built fullstack systems for weather data products.
@hidden @summary Alternative summary kept for future tailoring.
- Developed real-time interfaces
- @hidden Worked on internal prototype tooling
:::
```

---

# 14. Region assignment rules

## Section-level default

A section belongs to one region by default, resolved from YAML.

Example:

```yaml id="707hg5"
regions:
  sidebar:
    sections:
      - education
      - skills
```

If a section is not assigned anywhere, it defaults to `main`.

---

## Block inheritance

Blocks inherit the region of their section by default.

---

## Explicit block override

A block may explicitly override its region:

```md id="qixhy7"
## Experience

:::block{role=note region=footer}
References available upon request.
:::
```

---

# 15. Validation rules

A valid content document should satisfy the following.

## H1

Exactly one H1 is recommended.

## Sections

Each H2 defines a section, including hidden H2 lines written as `@hidden ## ...`.

## Block validity

A block is valid if it contains at least one meaningful content element, such as:

* title
* summary
* note
* image
* list items
* paragraphs
* nested blocks

## Region conflicts

A section should not be assigned to more than one region by default.

## Unknown attributes

Unknown block attributes are valid and should be preserved.

## Unknown directives

Unknown directives may be preserved as custom fields if the implementation allows it.

## Hidden content

Hidden content is valid and should be preserved in the AST with a hidden marker rather than discarded.

## Block classes

A generic block should render with a base class plus semantic modifiers.

Example strategy:

* base: `.resume-block`
* kind modifier: `.resume-block--job`
* role modifier: `.resume-block--contact`
* variant modifier: `.is-timeline-card`

Example:

```html id="w4r76t"
<article class="resume-block resume-block--job is-timeline-card" data-region="main">
```

Another example:

```html id="he0zie"
<div class="resume-block resume-block--contact" data-region="header">
```

## Region attributes

Blocks and sections may include:

* `data-region="header"`
* `data-region="sidebar"`

## Hidden rendering behavior

By default, hidden content should not be rendered in normal HTML/PDF output.

This includes hidden section titles declared with `@hidden ## ...`.

Implementations may optionally support an editor/debug mode that renders hidden content with a diagnostic class such as:

```text id="e30hsk"
.is-hidden-source
```

---

# 19. Example document

```md id="z8grl8"
# Jane Doe

:::block{role=contact region=header}
- @icon location_on | City, Country
- @icon mail | hello@example.com
- @icon public | github.com/example
:::

## Summary

:::block{role=summary}
@summary Fullstack Software Engineer with 5 years of experience building scalable web applications and microservices.
@note Open to international opportunities, relocation, and remote work.
@hidden Internal source note for future tailoring.
:::

## Experience

:::block{kind=job role=experience}
### Software Engineer — Meteomatics
@date Nov 2024 – Present
@org Meteomatics
@stack React, Angular, FastAPI, Node.js, Docker, Nomad
- Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.
- Developed scalable backend services and APIs.
- @hidden Contributed to internal prototype work not shown publicly.
:::

## Skills

:::block{role=skills}
- JavaScript
- Python
- React
- FastAPI
:::
```
