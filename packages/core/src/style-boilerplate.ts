/** Base stylesheet boilerplate, with no per-class rules. */
export const STYLE_BOILERPLATE = `:root {
  --page-bg: #dbe5ec;
  --paper: #fcfeff;
  --sidebar-bg: #d8e6ee;
  --sidebar-line: #b7cdda;
  --ink: #1f2b34;
  --muted: #506572;
  --soft: #6f8390;
  --line: #c6d8e3;
  --accent: #1c425b;
  --icon: #2b5f7d;
}

body {
  background: var(--page-bg);
  color: var(--ink);
  font-family: "Montserrat", "Avenir Next", "Segoe UI", Arial, sans-serif;
  font-size: 2.72mm;
  line-height: 1.42;
}

a {
  color: inherit;
  text-decoration: none;
}

.page {
  margin: 4.5mm auto;
  background: var(--paper);
}
`;

function extractClassNames(html: string): string[] {
  const names = new Set<string>();
  for (const match of html.matchAll(/class="([^"]+)"/g)) {
    for (const name of match[1].trim().split(/\s+/)) {
      if (name) names.add(name);
    }
  }
  return [...names].sort();
}

/** Boilerplate stylesheet plus an empty rule for every class used in `renderedHtml`. */
export function buildStylesheetBoilerplate(renderedHtml: string): string {
  const classNames = extractClassNames(renderedHtml);
  const emptyRules = classNames.map((name) => `.${name} {\n}\n`).join("\n");
  return `${STYLE_BOILERPLATE}\n${emptyRules}`;
}
