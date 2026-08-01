import type MarkdownIt from "markdown-it";
import type { StateCore, Token } from "./state-types.ts";
import { makeToken } from "./state-types.ts";
import type { FrontmatterData } from "../types.ts";

type RegionsConfig = FrontmatterData["regions"];
type RegionsEnv = { regions?: RegionsConfig };

const DEFAULT_REGION = "main";

function buildSectionRegionMap(regions: RegionsConfig): Map<string, string> {
  const map = new Map<string, string>();
  for (const [region, config] of Object.entries(regions ?? {})) {
    for (const sectionId of config?.sections ?? []) {
      if (!map.has(sectionId)) map.set(sectionId, region);
    }
  }
  return map;
}

// Regions render in the order their keys appear in frontmatter `regions`,
// not a hardcoded header/main/sidebar/footer order. A section assigned to
// `main` by fallback (no declared region) still needs somewhere to render
// even if `main` has no explicit entry in frontmatter, so it's appended
// last when missing.
function regionOrder(regions: RegionsConfig): string[] {
  const declared = Object.keys(regions ?? {});
  if (declared.includes(DEFAULT_REGION)) return declared;
  return [...declared, DEFAULT_REGION];
}

function sectionIdOf(headingOpen: Token): string | null {
  const classAttr = headingOpen.attrs?.find(([name]) => name === "class");
  return classAttr ? classAttr[1] : null;
}

// A run is a no-op if every token in it is invisible: a `@hidden` heading
// with no `.id` (so it can't anchor a region) contributes nothing but its
// own open/inline/close tokens. Without this check, e.g. a leading
// `@hidden # Title` line (a doc-level marker, not a section) would still
// produce an empty, unplaced `.resume-section` in the grid.
function isNoopRun(run: Token[]): boolean {
  return run.every((token) => {
    if (token.type === "heading_open" || token.type === "heading_close") {
      return (token.meta as { hidden?: boolean } | null)?.hidden === true;
    }
    return token.type === "inline" && !token.content && !token.children?.length;
  });
}

// Reorders a region's sections to match `regions.<name>.sections`. Sections
// with an id not listed there (or with no id at all) keep their relative
// source order, appended after the declared ones.
function orderEntries<T extends { id: string | null }>(
  entries: T[],
  declaredOrder: string[],
): T[] {
  const byId = new Map<string, T[]>();
  const unlisted: T[] = [];

  for (const entry of entries) {
    if (entry.id && declaredOrder.includes(entry.id)) {
      const list = byId.get(entry.id) ?? [];
      list.push(entry);
      byId.set(entry.id, list);
    } else {
      unlisted.push(entry);
    }
  }

  const ordered: T[] = [];
  for (const id of declaredOrder) {
    const matches = byId.get(id);
    if (matches) ordered.push(...matches);
  }

  return [...ordered, ...unlisted];
}

// Auto-wraps h3+ sub-headings the same way `:::block` does manually: each
// h3 (and any deeper heading found inside it, recursively) gets its own
// `<div class="resume-block">` spanning from the heading to the next
// sibling heading of the same or shallower level. This lets job/project
// entries be written as bare `### Title` instead of requiring an explicit
// `:::block` wrapper. h1/h2 are untouched here - h2 keeps its existing
// region/section handling, and h1 (the one-off document title) is never
// auto-wrapped since its content just extends to the end of the document
// today, and wrapping that would swallow every region into one div.
function nestSubheadings(tokens: Token[], level: number): Token[] {
  if (level > 6) return tokens;
  const tag = `h${level}`;

  const starts: number[] = [];
  tokens.forEach((token, index) => {
    if (token.type === "heading_open" && token.tag === tag) starts.push(index);
  });
  if (starts.length === 0) return nestSubheadings(tokens, level + 1);

  const out: Token[] = [];
  if (starts[0] > 0) {
    out.push(...nestSubheadings(tokens.slice(0, starts[0]), level + 1));
  }

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? tokens.length;
    const run = tokens.slice(start, end);

    const closeIndex = run.findIndex((token) => token.type === "heading_close");
    const heading = run.slice(0, closeIndex + 1);
    const body = nestSubheadings(run.slice(closeIndex + 1), level + 1);

    const blockOpen = makeToken("container_open", "div", 1);
    blockOpen.attrSet("class", "resume-block");

    out.push(blockOpen, ...heading, ...body, makeToken("container_close", "div", -1));
  }

  return out;
}

// Groups top-level sections into <div data-region="..."> wrappers per the
// frontmatter `regions.*.sections` map, using each section's leading `h2`
// (tagged with its `.id` class by headingAttrsPlugin, or directly by
// hidden.ts for `@hidden` headings) as the anchor. Each section run (the
// heading plus everything up to the next top-level heading) also gets its
// own `<div class="resume-section resume-section--<id>" data-section="<id>">`
// wrapper, so a section's heading + summary + entries can be laid out as one
// grid/flex item instead of needing per-block or per-entry placement rules.
//
// Assumes `h2` never appears nested inside a `:::block{...}` container -
// only true top-level headings split sections; sub-headings inside blocks
// (job/project titles, etc.) use h3+ and stay inside their section's run.
export default function regionsPlugin(md: MarkdownIt): void {
  md.core.ruler.after("heading_attrs", "regions", (state: StateCore) => {
    const { regions } = (state.env ?? {}) as RegionsEnv;
    if (!regions || Object.keys(regions).length === 0) return;

    const sectionRegionMap = buildSectionRegionMap(regions);
    const tokens = state.tokens;

    const runStarts = [0];
    tokens.forEach((token, index) => {
      if (token.type === "heading_open" && token.tag === "h2") {
        runStarts.push(index);
      }
    });

    // Each run keeps its section id (if any) so it can be reordered to
    // match `regions.<name>.sections`, rather than staying in source order.
    const entries = new Map<string, Array<{ id: string | null; tokens: Token[] }>>();
    for (let i = 0; i < runStarts.length; i++) {
      const start = runStarts[i];
      const end = runStarts[i + 1] ?? tokens.length;
      const run = tokens.slice(start, end);
      if (run.length === 0 || isNoopRun(run)) continue;

      const heading = run[0].type === "heading_open" ? run[0] : null;
      const sectionId = heading ? sectionIdOf(heading) : null;
      const region = (sectionId && sectionRegionMap.get(sectionId)) ||
        DEFAULT_REGION;

      const list = entries.get(region) ?? [];
      list.push({ id: sectionId, tokens: nestSubheadings(run, 3) });
      entries.set(region, list);
    }

    // No outer wrapper here - the caller (e.g. the CLI's page/document
    // template) owns the single root element these regions are embedded
    // into, and should carry the `resume` class itself.
    const out: Token[] = [];

    for (const region of regionOrder(regions)) {
      const list = entries.get(region);
      if (!list || list.length === 0) continue;

      const declaredOrder = regions?.[region]?.sections ?? [];
      const ordered = orderEntries(list, declaredOrder);

      const regionOpen = makeToken("container_open", "div", 1);
      regionOpen.attrSet("class", `resume-region resume-region--${region}`);
      regionOpen.attrSet("data-region", region);

      out.push(regionOpen);
      for (const entry of ordered) {
        const sectionOpen = makeToken("container_open", "div", 1);
        sectionOpen.attrSet("class", "resume-section");
        if (entry.id) {
          sectionOpen.attrJoin("class", `resume-section--${entry.id}`);
          sectionOpen.attrSet("data-section", entry.id);
        }
        out.push(sectionOpen);
        out.push(...entry.tokens);
        out.push(makeToken("container_close", "div", -1));
      }
      out.push(makeToken("container_close", "div", -1));
    }

    state.tokens = out;
  });
}
