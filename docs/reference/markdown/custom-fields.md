# Custom fields

Inside a block, `@fieldname text` renders a labeled field:

```md
:::block{role=title}
@subtitle Senior Data Scientist
:::
```
→ `<div class="resume-field resume-field--subtitle">Senior Data Scientist</div>`

Which field names are recognized is configured in frontmatter via
`custom.field` (defaults to `title`, `subtitle`, `summary` — see
[YAML → custom.field](/reference/frontmatter-config#custom-field)). Using `@something` that
isn't in that list, and isn't one of the [built-in directives](/reference/markdown/directives),
is flagged as an unknown marker.
