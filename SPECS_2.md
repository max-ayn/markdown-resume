1. JSON Schema
1.1 Purpose

This schema validates the normalized resume document model after parsing the Markdown source.

It supports both modes:

inline-only mode
YAML mode

The difference is only in how metadata is authored. After parsing, both produce the same JSON structure.

1.2 Resume document JSON Schema
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/resume-semantic.schema.json",
  "title": "Semantic Resume Document",
  "type": "object",
  "additionalProperties": false,
  "required": ["document", "sections"],
  "properties": {
    "document": {
      "$ref": "#/$defs/documentMeta"
    },
    "sections": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/section"
      }
    }
  },
  "$defs": {
    "documentMeta": {
      "type": "object",
      "additionalProperties": true,
      "properties": {
        "template": {
          "type": "string",
          "default": "resume"
        },
        "name": {
          "type": "string"
        },
        "title": {
          "type": "string"
        },
        "photo": {
          "type": "string"
        },
        "sidebar_sections": {
          "type": "array",
          "items": {
            "type": "string",
            "pattern": "^[a-z0-9-]+$"
          },
          "uniqueItems": true
        },
        "theme": {
          "$ref": "#/$defs/theme"
        },
        "mode": {
          "type": "string",
          "enum": ["inline", "yaml"]
        }
      }
    },
    "theme": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "accent": { "$ref": "#/$defs/color" },
        "bg": { "$ref": "#/$defs/color" },
        "paper": { "$ref": "#/$defs/color" },
        "sidebar": { "$ref": "#/$defs/color" },
        "ink": { "$ref": "#/$defs/color" },
        "muted": { "$ref": "#/$defs/color" },
        "line": { "$ref": "#/$defs/color" },
        "chip": { "$ref": "#/$defs/color" }
      }
    },
    "color": {
      "type": "string",
      "pattern": "^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$"
    },
    "section": {
      "type": "object",
      "additionalProperties": false,
      "required": ["id", "title", "blocks"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$"
        },
        "title": {
          "type": "string"
        },
        "column": {
          "type": "string",
          "enum": ["main", "sidebar"]
        },
        "blocks": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/block"
          }
        }
      }
    },
    "block": {
      "oneOf": [
        { "$ref": "#/$defs/contactBlock" },
        { "$ref": "#/$defs/leadBlock" },
        { "$ref": "#/$defs/noteBlock" },
        { "$ref": "#/$defs/entryBlock" },
        { "$ref": "#/$defs/tagsBlock" },
        { "$ref": "#/$defs/factListBlock" },
        { "$ref": "#/$defs/groupListBlock" }
      ]
    },
    "contactBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "items"],
      "properties": {
        "type": {
          "const": "contact"
        },
        "items": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/richText"
          }
        }
      }
    },
    "leadBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "text"],
      "properties": {
        "type": {
          "const": "lead"
        },
        "text": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "noteBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "text"],
      "properties": {
        "type": {
          "const": "note"
        },
        "text": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "entryBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "kind"],
      "properties": {
        "type": {
          "const": "entry"
        },
        "kind": {
          "type": "string",
          "enum": [
            "generic",
            "job",
            "project",
            "education",
            "award",
            "certification",
            "volunteering"
          ]
        },
        "title": {
          "type": "string"
        },
        "meta": {
          "type": "string"
        },
        "summary": {
          "type": "string"
        },
        "links": {
          "type": "string"
        },
        "image": {
          "type": "string"
        },
        "stack": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "highlights": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "allOf": [
        {
          "anyOf": [
            { "required": ["title"] },
            { "required": ["summary"] },
            { "required": ["highlights"] }
          ]
        }
      ]
    },
    "tagsBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "items"],
      "properties": {
        "type": {
          "const": "tags"
        },
        "items": {
          "type": "array",
          "minItems": 1,
          "items": {
            "type": "string"
          }
        }
      }
    },
    "factListBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "items"],
      "properties": {
        "type": {
          "const": "fact-list"
        },
        "items": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/richText"
          }
        }
      }
    },
    "groupListBlock": {
      "type": "object",
      "additionalProperties": false,
      "required": ["type", "items"],
      "properties": {
        "type": {
          "const": "group-list"
        },
        "items": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/groupItem"
          }
        }
      }
    },
    "groupItem": {
      "type": "object",
      "additionalProperties": false,
      "required": ["label", "value"],
      "properties": {
        "label": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      }
    },
    "richText": {
      "type": "string"
    }
  }
}
1.3 Example JSON document
{
  "document": {
    "template": "resume",
    "mode": "yaml",
    "name": "Maxime Abylon",
    "title": "Fullstack Software Engineer",
    "photo": "./assets/maxime.jpg",
    "sidebar_sections": [
      "projects",
      "education",
      "skills",
      "soft-skills",
      "languages",
      "interests"
    ],
    "theme": {
      "accent": "#465d95",
      "bg": "#ececed",
      "paper": "#f8f8f8",
      "sidebar": "#f2f2f3",
      "ink": "#1f2430",
      "muted": "#6b7280",
      "line": "#d7d9de",
      "chip": "#dde6fb"
    }
  },
  "sections": [
    {
      "id": "summary",
      "title": "Summary",
      "column": "main",
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
    },
    {
      "id": "experience",
      "title": "Experience",
      "column": "main",
      "blocks": [
        {
          "type": "entry",
          "kind": "job",
          "title": "Software Engineer — Meteomatics",
          "meta": "Nov 2024 – Present | St. Gallen, Switzerland",
          "stack": [
            "React",
            "Angular",
            "FastAPI",
            "Node.js",
            "Docker",
            "Nomad"
          ],
          "highlights": [
            "Built and maintained a fullstack ecosystem for weather data processing and drone monitoring.",
            "Developed scalable backend services and APIs."
          ]
        }
      ]
    }
  ]
}
2. EBNF grammar

This grammar describes the source file, not the normalized JSON.

It covers both versions:

inline-only
YAML + body

It is intentionally pragmatic, not a full CommonMark grammar.

2.1 Lexical conventions
newline        = "\n" ;
ws             = " " | "\t" ;
opt_ws         = { ws } ;
text_char      = ? any character except newline ? ;
text_line      = { text_char } ;
blank_line     = opt_ws , newline ;
nonblank_line  = text_line , newline ;
identifier     = letter , { letter | digit | "-" | "_" } ;
section_id     = letter , { letter | digit | "-" } ;
letter         = "A"…"Z" | "a"…"z" ;
digit          = "0"…"9" ;
2.2 Top-level document grammar
document           = [ front_matter ] , [ inline_preamble ] , h1_heading , body ;

front_matter       = "---" , newline ,
                     { yaml_line } ,
                     "---" , newline ;

yaml_line          = text_line , newline ;

inline_preamble    = { document_directive | blank_line } ;

body               = { section | block | blank_line | markdown_line } ;

markdown_line      = text_line , newline ;
2.3 Inline-only document directives
document_directive = "@" , document_key , ws , directive_value , newline ;

document_key       = "template"
                   | "name"
                   | "title"
                   | "photo"
                   | "sidebar"
                   | "accent"
                   | "theme-bg"
                   | "theme-paper"
                   | "theme-sidebar"
                   | "theme-ink"
                   | "theme-muted"
                   | "theme-line"
                   | "theme-chip" ;

directive_value    = text_line ;
2.4 Headings and sections
h1_heading         = "#", ws, text_line, newline ;

section            = h2_heading , { section_content } ;

h2_heading         = "##", ws, text_line, newline ;
h3_heading         = "###", ws, text_line, newline ;

section_content    = block
                   | markdown_block
                   | blank_line ;

markdown_block     = nonblank_line , { nonblank_line | blank_line } ;
2.5 Semantic blocks
block              = contact_block
                   | lead_block
                   | note_block
                   | entry_block
                   | tags_block
                   | fact_list_block
                   | group_list_block ;

contact_block      = block_open("contact") , list_body , block_close ;
lead_block         = block_open("lead") , paragraph_body , block_close ;
note_block         = block_open("note") , paragraph_body , block_close ;
tags_block         = block_open("tags") , list_body , block_close ;
fact_list_block    = block_open("fact-list") , list_body , block_close ;
group_list_block   = block_open("group-list") , list_body , block_close ;

entry_block        = entry_open , entry_body , block_close ;
2.6 Block delimiters
block_open(name)   = ":::" , name , opt_ws , newline ;

entry_open         = ":::" , "entry" , [ entry_attrs ] , opt_ws , newline ;

entry_attrs        = "{" , "kind" , "=" , entry_kind , "}" ;

entry_kind         = "generic"
                   | "job"
                   | "project"
                   | "education"
                   | "award"
                   | "certification"
                   | "volunteering" ;

block_close        = ":::" , opt_ws , newline ;
2.7 Entry body grammar
entry_body         = [ h3_heading ] ,
                     { entry_component | blank_line } ;

entry_component    = meta_directive
                   | summary_directive
                   | links_directive
                   | image_directive
                   | stack_directive
                   | bullet_list
                   | paragraph_body ;

meta_directive     = "@meta" , ws , text_line , newline ;
summary_directive  = "@summary" , ws , text_line , newline ;
links_directive    = "@links" , ws , text_line , newline ;
image_directive    = "@image" , ws , text_line , newline ;
stack_directive    = "@stack" , ws , csv_line , newline ;

csv_line           = csv_item , { "," , opt_ws , csv_item } ;
csv_item           = { text_char - "," } ;
2.8 Paragraphs and lists
paragraph_body     = paragraph_line , { paragraph_line | blank_line } ;

paragraph_line     = non_directive_line ;

bullet_list        = bullet_item , { bullet_item } ;

bullet_item        = "-" , ws , text_line , newline ;

list_body          = bullet_list ;

non_directive_line = ? any nonblank line that does not start with "@meta", "@summary",
                       "@links", "@image", "@stack", ":::", "#", "##", or "###" ? ;
3. Normalization rules

These are the rules that connect source syntax to the JSON model.

3.1 Section id normalization

Normalize section titles to ids:

lowercase
trim whitespace
replace spaces with -
remove punctuation except -

Examples:

Soft Skills → soft-skills
Work Experience → work-experience
3.2 Sidebar assignment

If section id appears in:

YAML sidebar_sections, or
inline @sidebar

then column = "sidebar", else column = "main".

3.3 Entry normalization

Inside an entry block:

### heading → title
@meta → meta
@summary → summary
@links → links
@image → image
@stack comma-separated values → stack[]
bullet items → highlights[]
3.4 Group list normalization

A group-list item of the form:

- **Languages:** JavaScript, Python

should normalize to:

{
  "label": "Languages",
  "value": "JavaScript, Python"
}

If no bold label is detected, use:

{
  "label": "",
  "value": "<full item text>"
}
4. Suggested parser pipeline

A robust implementation order is:

detect YAML front matter if present
parse inline document directives if present
parse H1
parse H2 sections
parse semantic fenced blocks inside sections
normalize content to AST/JSON
validate JSON against schema
render HTML from validated JSON
5. Minimal HTML mapping contract

Once JSON is valid, render with these class hooks:

contact     -> .resume-contact
lead        -> .resume-lead
note        -> .resume-note
entry       -> .resume-entry + .resume-entry--{kind}
tags        -> .resume-taglist / .resume-tag
fact-list   -> .resume-fact-list
group-list  -> .resume-group-list
section     -> .resume-section + .resume-section--{id}

Entry subfields:

title       -> .resume-entry__title
meta        -> .resume-entry__meta
summary     -> .resume-entry__summary
links       -> .resume-entry__links
image       -> .resume-entry__image
stack       -> .resume-entry__stack
highlights  -> .resume-entry__highlights
6. Practical note

If you want strict machine validation, the best architecture is:

write source in your custom Markdown syntax
parse into JSON AST
validate JSON AST with the schema above
render HTML

That is more reliable than trying to validate raw Markdown directly with JSON Schema.

7. Optional stricter schema split

You may eventually want two schemas:

resume-source-inline.schema.json
resume-ast.schema.json

But in practice, the AST schema is the useful one.

8. AI-ready generation contract

You can hand this to an AI:

Generate resume source that conforms to the semantic resume grammar.

Requirements:
- Use either YAML front matter or inline document directives, not both unless explicitly requested.
- Use exactly one H1 for the candidate name.
- Use H2 for top-level sections.
- Use semantic fenced blocks: :::contact, :::lead, :::note, :::entry, :::tags, :::fact-list, :::group-list.
- Use :::entry{kind=...} for each job, project, and education item.
- Inside entry blocks, use @meta, @summary, @links, @image, @stack, and bullet points.
- Keep the output parseable under the EBNF grammar and normalizable to the JSON schema.

If you want, I can turn this into actual files:

resume-ast.schema.json
resume-source.ebnf
and a small TypeScript parser scaffold.