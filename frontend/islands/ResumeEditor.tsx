import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  Decoration,
  EditorView,
  type ViewUpdate,
  ViewPlugin,
  WidgetType,
} from "@codemirror/view";
import { Compartment, EditorState, RangeSetBuilder } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { css as cssLang } from "@codemirror/lang-css";
import { basicSetup } from "codemirror";

type Tab = "markdown" | "css";
type DiffTab = "markdown" | "css";

interface ResumeEditorProps {
  initialMarkdown: string;
  initialCss: string;
}

interface GeneratedDraft {
  markdown: string;
  css: string;
  notes?: string;
  instruction: string;
}

const STORAGE_KEYS = {
  markdown: "resume-editor:v2:markdown",
  css: "resume-editor:v2:css",
};
const PREVIEW_TIMEOUT_MS = 30_000;
const PDF_TIMEOUT_MS = 45_000;
const CHAT_TIMEOUT_MS = 90_000;
const COLOR_CODE_REGEX =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|(?:rgb|hsl)a?\([^)\n]+\)/g;

class ColorSwatchWidget extends WidgetType {
  constructor(private readonly color: string) {
    super();
  }

  override eq(other: ColorSwatchWidget): boolean {
    return other.color === this.color;
  }

  override toDOM(): HTMLElement {
    const swatch = document.createElement("span");
    swatch.className = "cm-color-swatch";
    swatch.style.backgroundColor = this.color;
    swatch.title = this.color;
    swatch.setAttribute("aria-hidden", "true");
    return swatch;
  }
}

function isSupportedColor(value: string): boolean {
  return typeof CSS !== "undefined" && CSS.supports("color", value.trim());
}

function buildColorSwatchDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>();

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    COLOR_CODE_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = COLOR_CODE_REGEX.exec(text)) !== null) {
      const matchedColor = match[0];
      if (!isSupportedColor(matchedColor)) continue;

      const endPos = from + match.index + matchedColor.length;
      builder.add(
        endPos,
        endPos,
        Decoration.widget({
          widget: new ColorSwatchWidget(matchedColor),
          side: 1,
        }),
      );
    }
  }

  return builder.finish();
}

const colorSwatchPlugin = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = buildColorSwatchDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildColorSwatchDecorations(update.view);
      }
    }
  },
  {
    decorations: (instance) => instance.decorations,
  },
);

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${Math.ceil(timeoutMs / 1000)}s`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function changedLineCount(before: string, after: string): number {
  const left = before.split(/\r?\n/);
  const right = after.split(/\r?\n/);
  const max = Math.max(left.length, right.length);
  let count = 0;

  for (let i = 0; i < max; i += 1) {
    if ((left[i] ?? "") !== (right[i] ?? "")) count += 1;
  }

  return count;
}

export default function ResumeEditor(props: ResumeEditorProps) {
  const [tab, setTab] = useState<Tab>("markdown");
  const [markdownText, setMarkdownText] = useState(props.initialMarkdown);
  const [cssText, setCssText] = useState(props.initialCss);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewError, setPreviewError] = useState<string>("");
  const [downloadError, setDownloadError] = useState<string>("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<GeneratedDraft | null>(null);
  const [diffTab, setDiffTab] = useState<DiffTab>("markdown");
  const [usePreviewImage, setUsePreviewImage] = useState(true);

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
        colorSwatchPlugin,
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
    let isCancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      const requestTimeout = setTimeout(() => controller.abort(), PREVIEW_TIMEOUT_MS);
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
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(body || `Preview failed: ${response.status}`);
        }

        const data = (await response.json()) as { html: string };
        if (isCancelled) return;
        setPreviewError("");
        setPreviewHtml(data.html);
      } catch (error) {
        if (isCancelled) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          setPreviewError(
            `Preview request timed out after ${Math.ceil(PREVIEW_TIMEOUT_MS / 1000)}s`,
          );
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        setPreviewError(message);
      } finally {
        clearTimeout(requestTimeout);
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [markdownText, cssText]);

  const downloadPdf = async () => {
    setIsDownloadingPdf(true);
    setDownloadError("");
    try {
      const response = await fetchWithTimeout("/api/pdf", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          markdown: markdownText,
          css: cssText,
        }),
      }, PDF_TIMEOUT_MS);

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

  const generateFromChat = async () => {
    const instruction = chatInput.trim();
    if (!instruction) {
      setChatError("Add an instruction first.");
      return;
    }

    setIsGenerating(true);
    setChatError("");

    try {
      const response = await fetchWithTimeout("/api/chat/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          instruction,
          markdown: markdownText,
          css: cssText,
          preset: "modern",
          includePreviewImage: usePreviewImage,
        }),
      }, CHAT_TIMEOUT_MS);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Generation failed: ${response.status}`);
      }

      const data = (await response.json()) as {
        markdown: string;
        css: string;
        notes?: string;
      };

      setDraft({
        markdown: data.markdown,
        css: data.css,
        notes: data.notes,
        instruction,
      });
      setDiffTab("markdown");
      setIsChatOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setChatError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyDraft = () => {
    if (!draft) return;
    setMarkdownText(draft.markdown);
    setCssText(draft.css);
    setTab("markdown");
    setDraft(null);
  };

  const discardDraft = () => {
    setDraft(null);
  };

  const markdownChanges = draft
    ? changedLineCount(markdownText, draft.markdown)
    : 0;
  const cssChanges = draft ? changedLineCount(cssText, draft.css) : 0;

  return (
    <>
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
          {downloadError
            ? <pre class="preview-error">{downloadError}</pre>
            : null}
          {previewError
            ? <pre class="preview-error">{previewError}</pre>
            : (
              <iframe
                title="Resume preview"
                class="preview-frame"
                srcDoc={previewHtml}
              />
            )}
        </section>
      </div>

      <button
        type="button"
        class="chat-fab"
        onClick={() => setIsChatOpen((value) => !value)}
      >
        {isChatOpen ? "Close AI" : "Open AI"}
      </button>

      {isChatOpen
        ? (
          <section class="chat-panel" aria-label="AI resume chat">
            <header class="chat-header">
              <strong>AI Resume</strong>
              <button
                type="button"
                class="chat-minimize"
                onClick={() => setIsChatOpen(false)}
              >
                Reduce
              </button>
            </header>
            <p class="chat-meta">Preset: modern</p>
            <label class="chat-option-row">
              <span class="chat-option-left">
                <input
                  type="checkbox"
                  checked={usePreviewImage}
                  onChange={(event) =>
                    setUsePreviewImage(
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                  disabled={isGenerating}
                />
                <span>Use preview image context</span>
              </span>
              <span
                class="chat-tooltip"
                title="Using image context can increase token usage and request cost."
              >
                i
              </span>
            </label>
            <textarea
              class="chat-input"
              value={chatInput}
              onInput={(event) =>
                setChatInput(
                  (event.currentTarget as HTMLTextAreaElement).value,
                )}
              maxLength={2000}
              disabled={isGenerating}
              placeholder="Example: Rewrite summary for senior backend roles and modernize style while keeping one-page fit."
            />
            <p class="chat-meta">
              {usePreviewImage
                ? "Preview snapshot will be sent with your request."
                : "Text-only request (no preview image)."}
            </p>
            {isGenerating
              ? (
                <div class="chat-working" aria-live="polite">
                  <span class="chat-spinner" />
                  <span>AI is generating your resume update...</span>
                </div>
              )
              : null}
            <div class="chat-actions">
              <span class="chat-count">{chatInput.length}/2000</span>
              <button
                type="button"
                class="chat-generate"
                onClick={generateFromChat}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
            {chatError ? <pre class="chat-error">{chatError}</pre> : null}
          </section>
        )
        : null}

      {draft
        ? (
          <section class="diff-overlay" aria-label="Generated diff review">
            <div class="diff-modal">
              <header class="diff-header">
                <strong>Review Generated Changes</strong>
                <span class="diff-instruction">{draft.instruction}</span>
              </header>

              <div class="diff-tabs" role="tablist" aria-label="Diff type">
                <button
                  type="button"
                  class={`diff-tab ${diffTab === "markdown" ? "active" : ""}`}
                  onClick={() => setDiffTab("markdown")}
                >
                  Markdown ({markdownChanges} changed lines)
                </button>
                <button
                  type="button"
                  class={`diff-tab ${diffTab === "css" ? "active" : ""}`}
                  onClick={() => setDiffTab("css")}
                >
                  CSS ({cssChanges} changed lines)
                </button>
              </div>

              <div class="diff-grid">
                <label class="diff-col">
                  <span>Current</span>
                  <textarea
                    readOnly
                    value={diffTab === "markdown" ? markdownText : cssText}
                  />
                </label>
                <label class="diff-col">
                  <span>Generated</span>
                  <textarea
                    readOnly
                    value={diffTab === "markdown" ? draft.markdown : draft.css}
                  />
                </label>
              </div>

              {draft.notes ? <p class="diff-notes">{draft.notes}</p> : null}

              <div class="diff-actions">
                <button
                  type="button"
                  class="discard-button"
                  onClick={discardDraft}
                >
                  Discard
                </button>
                <button type="button" class="apply-button" onClick={applyDraft}>
                  Apply
                </button>
              </div>
            </div>
          </section>
        )
        : null}
    </>
  );
}
