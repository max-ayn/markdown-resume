import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import ResumeEditor from "../islands/ResumeEditor.tsx";

async function readFirst(paths: string[]): Promise<string> {
  for (const path of paths) {
    try {
      return await Deno.readTextFile(path);
    } catch {
      // Try next path.
    }
  }

  return "";
}

export default define.page(async function Home() {
  const [markdown, css] = await Promise.all([
    readFirst(["../resume/resume.md", "../resume/CV.md", "../resume.md"]),
    readFirst(["../resume/styles.css", "../styles.css"]),
  ]);

  return (
    <>
      <Head>
        <title>Resume Editor</title>
      </Head>
      <main class="app-shell">
        <ResumeEditor initialMarkdown={markdown} initialCss={css} />
      </main>
    </>
  );
});
