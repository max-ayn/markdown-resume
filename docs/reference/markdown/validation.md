# Validation

Rendering always runs a validation pass and reports issues (it does not stop
the render). Checked:

- an `@field` from `custom.field` with no value (empty field)
- `@date`/`@date:key` with a `key` not declared in frontmatter `date`, or
  with no value
- `@icon:provider` with a `provider` not declared in frontmatter `icons`, or
  with no icon name
- `@image key` where `key` isn't in frontmatter `images`
- any `@marker` that isn't a [custom field](/reference/markdown/custom-fields)
  or a [built-in directive](/reference/markdown/directives)
- a section id listed in `regions.*.sections` that no heading's `{.id}`
  actually declares
