# CLI Tool

`@markdown-resume/cli` is the command-line entrypoint for the project:
markdown + CSS in, HTML/PDF out.

```bash
pnpm run cli -- -i examples/software -o out -pdf
```

It's part of this repository's pnpm workspace (`packages/cli`) — there's no
standalone published package yet, so use it by cloning the repo and running
it via `pnpm run cli --`, as shown in
[Your first example](/guide/getting-started#your-first-example).

For every flag and subcommand, see the [CLI reference](/guide/tooling/cli-reference).
