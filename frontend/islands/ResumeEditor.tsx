import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { EditorView } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { css as cssLang } from "@codemirror/lang-css";
import { basicSetup } from "codemirror";

type Tab = "markdown" | "css";

interface ResumeEditorProps {
  initialMarkdown: string;
  initialCss: string;
}

const STORAGE_KEYS = {
  markdown: "resume-editor:v2:markdown",
  css: "resume-editor:v2:css",
};

export default function ResumeEditor(props: ResumeEditorProps) {
  const [tab, setTab] = useState<Tab>("markdown");
  const [markdownText, setMarkdownText] = useState(props.initialMarkdown);
  const [cssText, setCssText] = useState(props.initialCss);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewError, setPreviewError] = useState<string>("");
  const [downloadError, setDownloadError] = useState<string>("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const tabRef = useRef<Tab>("markdown");
  const previousTabRef = useRef<Tab>("markdown");
  const languageCompartment = useMemo(() => new Compartment(), []);

  useEffect(() => {
    const storedMarkdown = localStorage.getItem(STORAGE_KEYS.markdown);
    const storedCss = localStorage.getItem(STORAGE_KEYS.css);

    if (storedMarkdown !== null) setMarkdownText(storedMarkdown);
    if (storedCss !== null) setCssText(storedCss);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.markdown, markdownText);
  }, [markdownText]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.css, cssText);
  }, [cssText]);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: markdownText,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        languageCompartment.of(markdown()),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const value = update.state.doc.toString();
          if (tabRef.current === "markdown") {
            setMarkdownText(value);
          } else {
            setCssText(value);
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [languageCompartment]);

  useEffect(() => {
    tabRef.current = tab;
    const view = viewRef.current;
    if (!view) return;

    const nextDoc = tab === "markdown" ? markdownText : cssText;
    const lang = tab === "markdown" ? markdown() : cssLang();
    const switchedTab = previousTabRef.current !== tab;
    previousTabRef.current = tab;
    if (!switchedTab) return;

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: nextDoc,
      },
      effects: languageCompartment.reconfigure(lang),
    });
  }, [tab, markdownText, cssText, languageCompartment]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const expectedDoc = tab === "markdown" ? markdownText : cssText;
    if (view.state.doc.toString() === expectedDoc) return;

    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: expectedDoc,
      },
    });
  }, [tab, markdownText, cssText]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            markdown: markdownText,
            css: cssText,
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(body || `Preview failed: ${response.status}`);
        }

        const data = (await response.json()) as { html: string };
        setPreviewError("");
        setPreviewHtml(data.html);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setPreviewError(message);
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [markdownText, cssText]);

  const downloadPdf = async () => {
    setIsDownloadingPdf(true);
    setDownloadError("");
    try {
      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          markdown: markdownText,
          css: cssText,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `PDF generation failed: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "resume.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDownloadError(message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div class="editor-layout">
      <section class="editor-pane" aria-label="Editor">
        <div class="editor-tabs" role="tablist" aria-label="Code type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "markdown"}
            class={`editor-tab ${tab === "markdown" ? "active" : ""}`}
            onClick={() => setTab("markdown")}
          >
            Markdown
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "css"}
            class={`editor-tab ${tab === "css" ? "active" : ""}`}
            onClick={() => setTab("css")}
          >
            CSS
          </button>
        </div>
        <div ref={containerRef} class="code-editor" />
      </section>

      <section class="preview-pane" aria-label="Live preview">
        <header class="preview-header">
          <span>Preview</span>
          <button
            type="button"
            class="download-button"
            onClick={downloadPdf}
            disabled={isDownloadingPdf}
          >
            {isDownloadingPdf ? "Generating..." : "Download PDF"}
          </button>
        </header>
        {downloadError ? <pre class="preview-error">{downloadError}</pre> : null}
        {previewError
          ? <pre class="preview-error">{previewError}</pre>
          : <iframe title="Resume preview" class="preview-frame" srcDoc={previewHtml} />}
      </section>
    </div>
  );
}
