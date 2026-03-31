Below is a complete, extensible specification for a Markdown-based CV/resume authoring format designed for:

human authoring
AI generation and editing
parser validation
semantic HTML rendering
CSS-based theming
high customization with custom blocks, regions, variants, images, header/footer, and future extensions

This spec is intentionally practical. It defines:

the authoring model
the semantic model
the source syntax
the normalized AST model
rendering expectations
validation rules
extension rules
Semantic Resume Markdown Specification
Version 1.0
1. Purpose

This specification defines a resume/CV authoring format built on top of Markdown.

It enables authors, parsers, and AI systems to create and manipulate highly customizable resumes while preserving:

Markdown readability
semantic structure
styling flexibility
predictable HTML generation
machine validation

The format supports both:

YAML front matter mode
inline-only mode

Both modes normalize to the same structured document model.

2. Design goals

The format must allow an AI or parser to:

identify document title and candidate identity
detect sections and their semantic meaning
distinguish layout regions such as header, main, sidebar, and footer
parse entries such as jobs, projects, education, certifications, and awards
parse contact info, summary, skills, languages, interests, and images
support custom semantic and presentation-oriented blocks
generate semantic HTML classes and rendering hooks
preserve normal Markdown inside blocks
support one-page and multi-page layouts
allow future extensions without breaking compatibility

The format is intended for:

resume generation
HTML rendering
PDF export
template-based theming
AI-assisted rewriting
structured editing
high customization using Markdown and custom conventions
3. Core principles
3.1 Semantic first

Block names should describe meaning before appearance.

Preferred:

:::entry{kind=job variant=compact}

Avoid:

:::blue-box
3.2 Presentation as hint, not meaning

Styling-related information should be carried through:

variant
region
class
props

not by creating purely visual block names.

3.3 Markdown remains the authoring surface

The source should stay readable to humans even before rendering.

3.4 Structured normalization

All valid documents should be normalizable into a structured AST/JSON model.

3.5 Extensibility

Unknown blocks and attributes should not break parsing.

4. Supported authoring modes
4.1 YAML mode

Global configuration is stored in YAML front matter.

4.2 Inline mode

Global configuration is stored in inline directives at the top of the document.

4.3 Common body syntax

The body syntax is identical in both modes.

5. Document model

A resume document consists of:

document metadata
one or more layout regions
one or more sections
one or more blocks
optional custom blocks
optional media blocks
6. Regions

A region identifies a high-level layout area.

Supported built-in regions:

header
main
sidebar
footer

Custom regions are allowed.

Examples:

hero
aside-left
cover-footer

If a section or block is assigned to a region, the renderer should place it there.

7. Sections

A section is a logical grouping of blocks and is usually introduced by a ## heading.

Common section ids include:

summary
experience
projects
education
skills
soft-skills
languages
interests
certifications
awards

Custom section ids are allowed.

A section may be assigned to a region.

8. Blocks

A block is the main semantic unit of content.

8.1 Built-in block types

Built-in blocks:

contact
lead
note
entry
tags
fact-list
group-list
image
header
footer
quote
callout
container
divider
html
8.2 Custom block types

Any other block name is allowed and must be treated as a custom block.

Example:

:::hero
Content
:::

This normalizes to a custom block with name hero.

9. Entries

An entry block represents a structured unit such as a job, project, education item, award, or certification.

9.1 Supported entry kinds

Supported built-in kinds:

generic
job
project
education
award
certification
volunteering

Custom kinds are allowed.

9.2 Entry fields

An entry may contain:

title
meta
summary
links
image
stack
highlights
subentries
props
10. Variants, classes, and props

Any block may declare optional presentation hints:

variant
region
class
props
10.1 Variant

A variant is a renderer-specific style hint.

Examples:

compact
featured
minimal
timeline
hero
accent
10.2 Class

A class is an optional custom CSS class hook.

Example:

:::callout{class=warning-box}
10.3 Props

Props are arbitrary key-value attributes.

Example:

:::image{variant=avatar align=right width=24mm}
11. YAML mode specification
11.1 Front matter

A document in YAML mode may begin with front matter delimited by ---.

Example:

---
template: resume
name: Maxime Abylon
title: Fullstack Software Engineer
photo: ./assets/maxime.jpg
sidebar_sections:
  - projects
  - education
  - skills
  - soft-skills
  - languages
  - interests
regions:
  header:
    variant: minimal
  sidebar:
    width: 31%
theme:
  accent: "#465d95"
  bg: "#ececed"
  paper: "#f8f8f8"
  sidebar: "#f2f2f3"
  ink: "#1f2430"
  muted: "#6b7280"
  line: "#d7d9de"
  chip: "#dde6fb"
---
11.2 Supported front matter keys

Top-level keys:

template
name
title
photo
sidebar_sections
regions
theme
meta
defaults
template

String. Template name, usually resume.

name

Candidate full name.

title

Candidate professional title.

photo

Path or URL to main portrait.

sidebar_sections

Array of section ids to render in sidebar.

regions

Object describing region-level rendering hints.

theme

Object of design tokens.

meta

Free metadata object.

defaults

Default block or section properties.

Example:

defaults:
  entry:
    variant: compact
11.3 Unknown front matter keys

Unknown keys are allowed and must be preserved as metadata.

12. Inline mode specification
12.1 Inline directives

Inline mode declares global settings before the first # heading.

Example:

@template resume
@name Maxime Abylon
@title Fullstack Software Engineer
@photo ./assets/maxime.jpg
@sidebar projects, education, skills, soft-skills, languages, interests
@accent #465d95
@theme-bg #ececed
@theme-paper #f8f8f8
@theme-sidebar #f2f2f3
@theme-ink #1f2430
@theme-muted #6b7280
@theme-line #d7d9de
@theme-chip #dde6fb
12.2 Supported inline directives

Supported built-in directives:

@template
@name
@title
@photo
@sidebar
@accent
@theme-bg
@theme-paper
@theme-sidebar
@theme-ink
@theme-muted
@theme-line
@theme-chip

Custom directives are allowed and must be preserved.

13. Heading rules
13.1 H1

Exactly one # heading should be used for the candidate name.

Example:

# Maxime Abylon
13.2 H2

## headings define top-level sections.

Example:

## Experience
## Skills
13.3 H3

Inside entry blocks, ### defines the entry title.

Outside entry, ### may be treated as normal Markdown or subsection heading.

14. Block syntax
14.1 Generic fenced block syntax
:::block-name
content
:::
14.2 Block with attributes
:::block-name{key=value key2=value2}
content
:::

Example:

:::entry{kind=job variant=compact region=main}
### Software Engineer — Meteomatics
@meta Nov 2024 – Present | St. Gallen, Switzerland
- Built and maintained...
:::
15. Block attributes

Supported generic attributes:

kind
variant
region
class

Any other attributes must be stored under props.

Example:

:::image{variant=avatar region=header width=24mm align=right}
./assets/maxime.jpg
:::

Normalizes to:

type = image
variant = avatar
region = header
props.width = "24mm"
props.align = "right"
16. Built-in blocks
16.1 contact

Used for contact information.

Expected content:

bullet list
optionally rich Markdown links

Example:

:::contact
- St. Gallen, Switzerland
- [max.abylon@gmail.com](mailto:max.abylon@gmail.com)
- +41 77 201 29 29
- [GitHub](https://github.com/Osysh)
:::
16.2 lead

Used for the main summary paragraph.

Example:

:::lead
Fullstack Software Engineer with 5 years of experience...
:::
16.3 note

Used for secondary summary or availability notes.

Example:

:::note
Open to international opportunities, relocation, and remote work.
:::
16.4 entry

Used for structured items like jobs, projects, education, awards.

16.5 tags

Used for keyword or chip-like items.

Example:

:::tags
- Team collaboration
- Ownership
- Continuous learning
:::
16.6 fact-list

Used for simple facts or plain list items.

Example:

:::fact-list
- English — TOEIC 920
- Spanish — Elementary proficiency
:::
16.7 group-list

Used for labeled groups.

Example:

:::group-list
- **Languages:** JavaScript, Python
- **Frontend:** React.js, Angular, Electron
:::
16.8 image

Used for standalone images.

Possible uses:

profile picture
featured project image
logo
decorative image

Example:

:::image{variant=avatar region=header}
./assets/maxime.jpg
:::
16.9 header

Used for content intended for header region.

16.10 footer

Used for content intended for footer region.

16.11 quote

Used for quoted or testimonial content.

16.12 callout

Used for visually highlighted content.

16.13 container

Used to group multiple child blocks.

16.14 divider

Used for explicit visual separation.

16.15 html

Used for raw HTML passthrough if the implementation allows it.

17. Entry syntax
17.1 Structure

An entry block may contain:

one optional ### heading for title
zero or one @meta
zero or one @summary
zero or one @links
zero or one @image
zero or one @stack
zero or more bullet items
optional Markdown paragraphs
optional nested custom blocks if implementation supports nesting
17.2 Example
:::entry{kind=job variant=compact}
### Software Engineer — Meteomatics
@meta Nov 2024 – Present | St. Gallen, Switzerland
@stack React, Angular, FastAPI, Node.js, Docker, Nomad
- Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.
- Developed scalable backend services and APIs.
:::
18. Entry directives

Inside an entry, these inline directives are recognized:

@meta
@summary
@links
@image
@stack
18.1 @meta

Text line for date/location/meta information.

Example:

@meta Nov 2024 – Present | St. Gallen, Switzerland
18.2 @summary

Short summary text.

18.3 @links

Text line containing links.

18.4 @image

Image path or URL attached to the entry.

18.5 @stack

Comma-separated technologies or keywords.

Example:

@stack React, Angular, FastAPI, Node.js
19. Custom blocks
19.1 Allowed

Any unknown block name is valid.

Example:

:::hero{variant=featured}
Distributed systems engineer with product mindset.
:::
19.2 Normalization

Unknown blocks must normalize as:

type = "custom"
name = <original block name>
19.3 Recommendation

Prefer semantic names over visual-only names.

Good:

hero
timeline
profile
achievement-grid

Less ideal:

blue-card
big-left-title
20. Images
20.1 Standalone image block
:::image{variant=avatar}
./assets/maxime.jpg
:::
20.2 Entry-attached image
:::entry{kind=project}
### Weather Drone Dashboard
@image ./assets/dashboard.png
- Real-time visualization platform...
:::
20.3 Image attributes

Suggested attributes:

variant
region
alt
width
height
align
fit

These normalize into block props.

21. Header and footer
21.1 Header block

Header content may be represented either by:

a header block
blocks assigned to region header

Example:

:::header{variant=minimal}
# Maxime Abylon
:::contact
- St. Gallen, Switzerland
:::
:::
21.2 Footer block

Footer content may be represented by:

:::footer{variant=minimal}
References available upon request.
:::
22. Normalized AST model

Every valid document should normalize into a structured object.

22.1 Top-level model
{
  "document": {},
  "regions": [],
  "sections": []
}
22.2 Document object

Contains:

template
mode
name
title
photo
theme
meta
defaults
22.3 Region object

Contains:

id
variant
props
22.4 Section object

Contains:

id
title
region
variant
class
props
blocks
22.5 Block object

Contains:

type
name (for custom blocks)
kind
variant
region
class
props
content-specific fields
23. AST field definitions
23.1 Common block fields

All blocks may include:

type
name
kind
variant
region
class
props
markdown
children
23.2 Entry block fields
title
meta
summary
links
image
stack
highlights
23.3 Contact block fields
items
23.4 Tags block fields
items
23.5 Group-list block fields
items[] where each item has:
label
value
23.6 Image block fields
src
alt
24. Section placement rules
24.1 YAML mode

If a section id appears in sidebar_sections, its default region is sidebar.

Otherwise default region is main.

24.2 Inline mode

If a section id appears in @sidebar, default region is sidebar.

24.3 Explicit region override

A section or block with explicit region overrides the default.

25. HTML rendering contract

A renderer should generate stable HTML classes.

25.1 Section classes
<section class="resume-section resume-section--experience" data-section="experience" data-region="main">
25.2 Block classes

Examples:

contact → .resume-contact
lead → .resume-lead
note → .resume-note
entry → .resume-entry.resume-entry--job
tags → .resume-taglist / .resume-tag
fact-list → .resume-fact-list
group-list → .resume-group-list
image → .resume-image
header → .resume-header
footer → .resume-footer
quote → .resume-quote
callout → .resume-callout
container → .resume-container
custom(name=hero) → .resume-custom.resume-custom--hero
25.3 Variant classes

If a block has a variant, add:

.is-<variant>

Example:

<article class="resume-entry resume-entry--job is-compact">
25.4 Custom class

If class is provided, append it.

26. Validation rules
26.1 General

A document is valid if it can be parsed into a normalized AST.

26.2 H1

Exactly one H1 is recommended.

26.3 Sections

Each H2 defines a section.

26.4 Entry validity

An entry is valid if it contains at least one of:

title
summary
highlights
26.5 Contact block

A contact block should contain at least one item.

26.6 Tags/fact-list/group-list

These blocks should contain at least one list item.

26.7 Unknown blocks

Unknown blocks are valid and normalize as custom blocks.

27. Extension rules
27.1 New block types

New block names are always allowed.

27.2 New attributes

New attributes are always allowed and normalize into props unless recognized as built-in.

27.3 New entry kinds

New kinds are allowed.

27.4 Forward compatibility

Parsers must preserve unknown metadata and props wherever possible.

28. Parser behavior

Recommended parsing order:

parse YAML front matter if present
parse inline directives before first H1 if present
parse H1 candidate name
parse H2 sections
parse fenced semantic blocks
parse entry directives
normalize Markdown body content
build AST
validate AST
render HTML or serialize for AI
29. AI generation rules

An AI generating source in this spec should:

use one H1 for the name
use H2 for top-level sections
use semantic blocks instead of positional assumptions
use entry blocks for jobs, projects, education
use @meta for dates and locations
use @stack for technologies
use bullet lists for achievements
use group-list for grouped skills
use tags for compact keyword-style items
use fact-list for languages and interests
keep content concise enough for target layout
preserve existing block types and attributes during edits
30. AI transport recommendation

For AI processing, this source format should preferably be converted into a normalized AST and then optionally serialized into a compact structured transport format such as JSON or TOON.

Recommended pipeline:

author in semantic Markdown
parse into AST
validate AST
send AST to AI
receive structured edits
validate edits
render to HTML/PDF
31. Example document in YAML mode
---
template: resume
name: Maxime Abylon
title: Fullstack Software Engineer
photo: ./assets/maxime.jpg
sidebar_sections: [projects, education, skills, soft-skills, languages, interests]
theme:
  accent: "#465d95"
  bg: "#ececed"
  paper: "#f8f8f8"
  sidebar: "#f2f2f3"
  ink: "#1f2430"
  muted: "#6b7280"
  line: "#d7d9de"
  chip: "#dde6fb"
---

# Maxime Abylon

:::contact
- St. Gallen, Switzerland
- [max.abylon@gmail.com](mailto:max.abylon@gmail.com)
- +41 77 201 29 29
- [GitHub](https://github.com/Osysh)
- [LinkedIn](https://linkedin.com/in/maximeabylon)
:::

## Summary

:::lead
Fullstack Software Engineer with 5 years of experience building scalable web applications and microservices.
:::

:::note
Open to international opportunities, relocation, and remote work.
:::

## Experience

:::entry{kind=job variant=compact}
### Software Engineer — Meteomatics
@meta Nov 2024 – Present | St. Gallen, Switzerland
@stack React, Angular, FastAPI, Node.js, Docker, Nomad
- Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.
- Developed scalable backend services and APIs.
:::

## Skills

:::group-list
- **Languages:** JavaScript, Python
- **Frontend:** React.js, Angular, Electron
- **Backend:** Node.js, FastAPI, Deno
:::
32. Example document in inline mode
@template resume
@name Maxime Abylon
@title Fullstack Software Engineer
@photo ./assets/maxime.jpg
@sidebar projects, education, skills, soft-skills, languages, interests
@accent #465d95

# Maxime Abylon

:::contact
- St. Gallen, Switzerland
- [max.abylon@gmail.com](mailto:max.abylon@gmail.com)
- +41 77 201 29 29
:::

## Summary

:::lead
Fullstack Software Engineer with 5 years of experience building scalable web applications and microservices.
:::
33. Minimal normalized AST example
{
  "document": {
    "template": "resume",
    "mode": "yaml",
    "name": "Maxime Abylon",
    "title": "Fullstack Software Engineer",
    "photo": "./assets/maxime.jpg",
    "theme": {
      "accent": "#465d95"
    }
  },
  "regions": [
    { "id": "header" },
    { "id": "main" },
    { "id": "sidebar" },
    { "id": "footer" }
  ],
  "sections": [
    {
      "id": "summary",
      "title": "Summary",
      "region": "main",
      "blocks": [
        {
          "type": "lead",
          "text": "Fullstack Software Engineer with 5 years of experience building scalable web applications and microservices."
        },
        {
          "type": "note",
          "text": "Open to international opportunities, relocation, and remote work."
        }
      ]
    }
  ]
}
34. Recommended implementation split

Best implementation split:

authoring layer: semantic Markdown
canonical data layer: normalized AST/JSON
AI exchange layer: JSON or TOON
rendering layer: HTML + CSS

This keeps each layer simple and debuggable.

35. Non-goals

This spec does not attempt to:

replace full CommonMark
validate arbitrary raw CSS
define one universal rendering template
guarantee perfect compatibility with every Markdown parser without custom extensions

It defines a structured Markdown dialect for resumes.

36. Recommended next versions

For version 1.1 or 2.0, you may want to add:

nested entries
timeline-specific entry fields
localization support
icon references
reusable components/macros
conditional rendering
block-level ids for patching
structured diffs for AI editing
37. Final recommendation

Yes, custom block entries for styling are fully compatible with this spec, as long as you keep the distinction clear:

semantic block name
optional presentation variant
optional renderer props

That is the strongest foundation for a customizable Markdown CV system.

If you want, the next best step is for me to turn this full spec into:

a formal JSON Schema v2
an updated extensible EBNF grammar
and a reference AST example file.