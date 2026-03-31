es — below is a clear authoring specification designed so an AI, parser, or renderer can reliably transform a resume written in Markdown into structured HTML.

I give you 2 versions:

Inline-only spec — no YAML, everything expressed in-body
YAML + body spec — global config in front matter, content semantics in body

The goal is the same in both cases:

human-readable Markdown
machine-readable conventions
stable HTML generation
easy CSS targeting
minimal ambiguity for AI
1. Design goals

This specification is for a resume/CV authoring format built on top of Markdown.

It must allow an AI or parser to:

identify document title and candidate identity
detect sections and their meaning
distinguish main-column vs sidebar sections
parse entries such as jobs, projects, and education
parse contact info, summary, skills, languages, interests
generate semantic HTML classes
preserve normal Markdown inside blocks

The format is intended for:

resume generation
PDF export
HTML theming
one-page and two-column CV layouts
2. Shared semantic model

Both versions produce the same semantic structure.

2.1 Document model

A resume document contains:

identity
contact block
summary block
experience section
optional projects section
education section
skills section
optional soft skills section
languages section
interests section
2.2 Supported semantic block types

The parser must recognize these semantic types:

contact
lead
note
entry
tags
fact-list
group-list
2.3 Supported entry kinds

An entry block may have one of these kinds:

job
project
education
award
certification
volunteering

If omitted, default kind is generic.

2.4 Supported inline directives inside entries

The parser must support these directives inside entry blocks:

@meta
@stack
@links
@image
@summary

These directives apply only to the current entry block.

3. HTML target model

Regardless of source syntax, the renderer should produce predictable HTML hooks.

3.1 Section HTML

Example:

<section class="resume-section resume-section--experience" data-section="experience" data-column="main">
  <h2 class="resume-section__title">Experience</h2>
</section>
3.2 Entry HTML

Example:

<article class="resume-entry resume-entry--job" data-kind="job">
  <h3 class="resume-entry__title">Software Engineer — Meteomatics</h3>
  <p class="resume-entry__meta">Nov 2024 – Present | St. Gallen, Switzerland</p>
  <ul class="resume-entry__stack">
    <li>React</li>
    <li>Angular</li>
  </ul>
  <ul class="resume-entry__highlights">
    <li>Built and maintained...</li>
  </ul>
</article>
3.3 Block HTML mapping

Suggested mappings:

contact → <div class="resume-contact">...</div>
lead → <p class="resume-lead">...</p>
note → <p class="resume-note">...</p>
fact-list → <div class="resume-fact-list"><ul>...</ul></div>
group-list → <div class="resume-group-list"><ul>...</ul></div>
tags → <ul class="resume-taglist"><li class="resume-tag">...</li></ul>
entry(kind=job) → <article class="resume-entry resume-entry--job">...</article>
4. Inline-only specification

This version uses no YAML at all.

Everything is defined with inline directives and named fenced blocks.

4.1 Document-level directives

Document-level directives must appear before the first heading.

Supported directives:

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
4.2 Rules for document-level directives
Each directive occupies one full line.
Format is @key value.
Values are raw text unless otherwise specified.
@sidebar is a comma-separated list of section ids.
Unknown directives may be ignored or stored as custom metadata.
If a directive appears multiple times, the last value wins.
4.3 Section headings

A top-level resume section uses Markdown heading level 2:

## Summary
## Experience
## Projects
## Education
## Skills
## Soft Skills
## Languages
## Interests

The parser should normalize the section id:

Summary → summary
Soft Skills → soft-skills
4.4 Named fenced blocks

Syntax:

:::block-name
content
:::

or with attributes:

:::entry{kind=job}
content
:::
Supported block names
contact
lead
note
entry
tags
fact-list
group-list
Rules
Block names are case-sensitive and lowercase.
Inner content is regular Markdown.
Unknown block names may be rendered as generic containers.
Blocks cannot overlap incorrectly.
4.5 Entry block grammar

An entry block contains:

one ### heading for title
zero or one @meta
zero or one @summary
zero or one @links
zero or one @image
zero or one @stack
zero or more bullet items

Example:

:::entry{kind=job}
### Software Engineer — Meteomatics
@meta Nov 2024 – Present | St. Gallen, Switzerland
@stack React, Angular, FastAPI, Node.js, Docker, Nomad
- Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.
- Developed scalable backend services and APIs.
:::
4.6 Entry directive rules
@meta

Single text line.

Example:

@meta Nov 2024 – Present | St. Gallen, Switzerland
@summary

Single text line or paragraph.

Example:

@summary Internal platform for system log analysis and debugging workflows.
@links

Single text line. May contain Markdown links.

Example:

@links Portfolio: [yourwebsite.com](https://yourwebsite.com) | GitHub: [github.com/yourname](https://github.com/yourname)
@image

Single path or URL.

Example:

@image ./assets/project-dashboard.png
@stack

Comma-separated values.

Example:

@stack React, Angular, FastAPI, Node.js

The renderer should convert them into chips/list items.

4.7 Tags block

Example:

:::tags
- React.js
- Angular
- Docker
- Nomad
:::

Must render as a chip list.

4.8 Fact-list block

Example:

:::fact-list
- English — TOEIC 920 (Professional proficiency)
- Spanish — Elementary proficiency
:::

Must render as a simple unordered list with resume-specific classes.

4.9 Group-list block

Example:

:::group-list
- **Languages:** JavaScript, Python
- **Frontend:** React.js, Angular, Electron
- **Backend:** Node.js, FastAPI, Deno
:::

Each item is a label-value row.

The label is recommended to be bold Markdown.

4.10 Inline-only example
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
- [github.com/Osysh](https://github.com/Osysh)
- [linkedin.com/in/maximeabylon](https://linkedin.com/in/maximeabylon)
:::

## Summary

:::lead
Fullstack Software Engineer with 5 years of experience building scalable web applications and microservices.
:::

:::note
Open to international opportunities, relocation, and remote work.
:::

## Experience

:::entry{kind=job}
### Software Engineer — Meteomatics
@meta Nov 2024 – Present | St. Gallen, Switzerland
@stack React, Angular, FastAPI, Node.js, Docker, Nomad
- Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.
- Developed scalable backend services and APIs.
:::
5. YAML-based specification

This version uses YAML front matter for global config and named semantic blocks in the body.

5.1 Front matter

The document may begin with YAML front matter delimited by ---.

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
5.2 Supported front matter keys

Top-level keys:

template
name
title
photo
sidebar_sections
theme
template

String. Usually resume.

name

String. Candidate full name.

title

String. Candidate professional title.

photo

String path or URL.

sidebar_sections

Array of normalized section ids.

Example:

sidebar_sections: [projects, education, skills, languages, interests]
theme

Object with optional keys:

accent
bg
paper
sidebar
ink
muted
line
chip
5.3 Front matter rules
Unknown keys may be preserved as metadata.
Missing keys fall back to defaults.
If sidebar_sections is missing, layout engine chooses defaults.
5.4 Body syntax

The body uses the same semantic block grammar as the inline-only version.

Supported blocks:

contact
lead
note
entry
tags
fact-list
group-list

Supported entry directives:

@meta
@summary
@links
@image
@stack
5.5 YAML-based example
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
- [github.com/Osysh](https://github.com/Osysh)
- [linkedin.com/in/maximeabylon](https://linkedin.com/in/maximeabylon)
:::

## Summary

:::lead
Fullstack Software Engineer with 5 years of experience building scalable web applications and microservices.
:::

:::note
Open to international opportunities, relocation, and remote work.
:::

## Experience

:::entry{kind=job}
### Software Engineer — Meteomatics
@meta Nov 2024 – Present | St. Gallen, Switzerland
@stack React, Angular, FastAPI, Node.js, Docker, Nomad
- Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.
- Developed scalable backend services and APIs.
:::
6. Parsing rules for AI or renderer

These rules are important if you want an AI to generate valid documents consistently.

6.1 General parsing order

The parser should process in this order:

parse global metadata
parse top-level heading #
parse named blocks
parse sections ##
parse entries :::entry
parse directives inside entries
parse standard Markdown inside block bodies
6.2 Priority rules
A named block always overrides generic Markdown interpretation.
Directives inside an entry apply only inside that entry.
A ### heading inside an entry is the entry title.
A ### heading outside an entry is treated as normal Markdown unless the renderer has a section-specific rule.
6.3 Section placement rule

If section id is included in sidebar config, render in sidebar.
Otherwise render in main column.

6.4 Defaults

If missing:

kind on entry → generic
template → resume
sidebar_sections → implementation default
title → omitted
photo → omitted
6.5 Validation rules

A valid entry should contain at least one of:

### title
bullet list
@summary

A valid contact, tags, fact-list, or group-list block should contain a list.

A valid lead or note block should contain text content.

7. AI generation rules

If you want an AI to write resumes in this syntax, these instructions help a lot.

7.1 Rules for AI output

The AI should:

use exactly one # heading for candidate name
use ## for top-level resume sections only
prefer semantic blocks over positional assumptions
never encode key structure in punctuation alone
use :::entry{kind=...} for jobs, projects, and education
use @meta for dates and location
use @stack for technologies
use bullet points for achievements
use :::group-list for grouped skills
use :::tags for compact soft skills
keep section ids consistent with sidebar config
7.2 Things the AI should avoid

The AI should avoid:

putting all contact information in one paragraph separated by |
using italics to represent metadata semantically
styling assumptions like “first paragraph means summary”
mixing multiple jobs into one entry
using free text when structured directives exist
8. Recommendation: which version to choose
Choose the inline-only spec if:
you want everything visible in-body
you want a pure Markdown DSL
you do not need a lot of global configuration
you want AI prompts to stay simple and self-contained
Choose the YAML spec if:
you want cleaner separation of config and content
you want theming, layout, and template selection
you want easier automation and rendering
you plan to support multiple resume templates
9. Recommended final choice

For most real use, I recommend:

YAML for global config
semantic blocks for body content

That usually gives the best balance of:

readability
machine parsing
AI reliability
maintainability
10. Short AI-ready instruction block

You can reuse this as a prompt for an AI writer:

Write the resume in semantic Markdown using this resume spec.

Rules:
- Use YAML front matter for global config if YAML mode is enabled.
- Use exactly one H1 for the candidate name.
- Use H2 for top-level sections only.
- Use :::contact for contact info as a bullet list.
- Use :::lead for the main summary.
- Use :::note for availability / mobility notes.
- Use :::entry{kind=job|project|education} for each resume item.
- Inside each entry, use:
  - H3 for the title
  - @meta for date and location
  - @stack for technologies
  - @links for portfolio or repository links
  - bullet points for achievements
- Use :::group-list for grouped technical skills.
- Use :::tags for compact soft skills or keyword chips.
- Use :::fact-list for languages and interests.
- Keep content concise enough for a one-page CV unless told otherwise.

I can turn this into a formal JSON schema / EBNF grammar next, which would make it even easier for an AI or parser to validate automatically.