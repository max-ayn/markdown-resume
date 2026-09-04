import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { run } from "../src/index.ts";

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

beforeEach(() => {
  process.exitCode = undefined;
});

afterEach(() => {
  process.exitCode = undefined;
});

it("check passes with exit code unset when the resume has no issues", async () => {
  const dir = await tempDir("cli-check-ok-");
  await writeFile(
    join(dir, "resume.md"),
    `# Jane Doe

## Summary
:::block{role=summary}
@summary Test summary
:::
`,
  );

  await run(["check", "-i", dir]);

  expect(process.exitCode).toBeUndefined();
});

it("check sets exit code 1 when the resume has validation issues", async () => {
  const dir = await tempDir("cli-check-issues-");
  await writeFile(
    join(dir, "resume.md"),
    `# Jane Doe

## Summary
:::block{role=summary}
@summary
:::
`,
  );

  await run(["check", "-i", dir]);

  expect(process.exitCode).toBe(1);
});

it("check disambiguates via --md when multiple markdown files exist", async () => {
  const dir = await tempDir("cli-check-md-flag-");
  await writeFile(join(dir, "a.md"), "# A\n");
  await writeFile(join(dir, "b.md"), "# B\n");

  await run(["check", "-i", dir, "--md", "b.md"]);

  expect(process.exitCode).toBeUndefined();
});

it("check disambiguates via -m single-char alias", async () => {
  const dir = await tempDir("cli-check-m-alias-");
  await writeFile(join(dir, "a.md"), "# A\n");
  await writeFile(join(dir, "b.md"), "# B\n");

  await run(["check", "-i", dir, "-m", "b.md"]);

  expect(process.exitCode).toBeUndefined();
});
