import { Head } from "fresh/runtime";
import { fromFileUrl, resolve } from "@std/path";
import { define } from "../utils.ts";
import ResumeEditor from "../islands/ResumeEditor.tsx";

const FRONTEND_ROOT = resolve(fromFileUrl(new URL("../", import.meta.url)));

type ResolvedFile = {
  content: string;
  path: string;
};

async function readFirst(paths: string[]): Promise<ResolvedFile> {
  for (const candidate of paths) {
    const path = resolve(FRONTEND_ROOT, candidate);
    try {
      return { content: await Deno.readTextFile(path), path };
    } catch {
      // Try next path.
    }
  }

  return { content: "", path: "" };
}

export default define.page(async function Home() {
  const [markdownFile, cssFile] = await Promise.all([
    readFirst([
      "../resume/highly-custom/a.md",
      "../resume/resume.md",
      "../resume/CV.md",
      "../resume.md",
    ]),
    readFirst([
      "../resume/highly-custom/q.css",
      "../resume/styles.css",
      "../styles.css",
    ]),
  ]);
  const markdown = markdownFile.content;
  const css = cssFile.content;

  return (
    <>
      <Head>
        <title>Resume Editor</title>
      </Head>
      <main class="app-shell">
        <ResumeEditor
          initialMarkdown={markdown}
          initialCss={css}
          initialMarkdownPath={markdownFile.path}
          initialCssPath={cssFile.path}
        />
      </main>
    </>
  );
});
