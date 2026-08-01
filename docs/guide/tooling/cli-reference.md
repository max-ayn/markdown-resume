# CLI Reference

```bash
pnpm run cli -- [-i <input_folder>] [-o <output_path>] [-md <filename>] [-style <path>] [-pdf | --with-pdf]
pnpm run cli -- generate-style [-i <input_folder>] [-o <output_path>]
pnpm run cli -- sanitized       [-i <input_folder>] [-o <output_path>]
pnpm run cli -- check           [-i <input_folder>]
```

## Flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `-i <input_folder>` | `.` | Folder to read the markdown/stylesheet from. |
| `-o <output_path>` | `.` | Folder to write HTML/PDF output to. |
| `-md <filename>` | *auto* | Markdown file, resolved relative to `-i`. |
| `-style <path>` | *auto* | Stylesheet, resolved relative to `-i`. |
| `-pdf` / `--with-pdf` | off | Also generate a PDF next to the HTML output. |

**Auto-discovery.** When `-md` (or `-style`) is omitted, the CLI looks for a
single `.md` (or `.css`) file directly inside `-i`:

- exactly one match → used automatically
- zero matches → error (`No markdown file found in <folder>.`)
- more than one match → error, listing the candidates, asking you to pass
  `-md`/`-style` explicitly

**Output filenames** are derived from the markdown file's basename:
`<output_path>/<name>.html` and, with `-pdf`, `<output_path>/<name>.pdf`.
Local image assets referenced from the markdown/CSS are copied into
`<output_path>/assets/`.

## Examples

Render a bundled example, auto-discovering `resume.md`/`styles.css`:

```bash
pnpm run cli -- -i examples/software -o out
```

HTML + PDF:

```bash
pnpm run cli -- -i examples/software -o out -pdf
```

Disambiguate when a folder has more than one markdown file:

```bash
pnpm run cli -- -i examples/software -o out -md resume.md -style styles.css
```

## Subcommands *(not implemented yet)*

These parse their flags (so the interface is stable) but currently print
`<command> is not implemented yet.` and exit with a non-zero status.

| Command | Intent |
| --- | --- |
| `generate-style` | Scaffold a starter stylesheet from the classes a render produces. |
| `sanitized` | Strip the semantic marker syntax back down to plain Markdown. |
| `check` | Batch-validate every markdown file in a folder. |

## Notes

- `pnpm run cli -- <args>` — the `--` is required so pnpm forwards the
  arguments to the script instead of interpreting them itself.
- Validation issues (unknown markers, missing declared sections, unresolved
  image keys, ...) are printed to stdout before rendering; they don't stop
  the render. See the [Markdown](/reference/markdown) and
  [YAML](/reference/yaml) references for what gets validated.
