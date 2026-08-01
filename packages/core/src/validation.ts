import type { FrontmatterData, ValidationIssue } from "./types.ts";

const DEFAULT_FIELD_NAMES = ["title", "subtitle", "summary"];
const BUILTIN_MARKERS = new Set([
  "date",
  "icon",
  "image",
  "note",
  "pair",
  "stack",
  "hidden",
]);

function getFieldNames(data: FrontmatterData): Set<string> {
  return new Set(
    (data.custom?.field?.filter(Boolean) ?? DEFAULT_FIELD_NAMES).map(String),
  );
}

function getDateKeys(data: FrontmatterData): Set<string> {
  const keys = new Set<string>();
  const dateConfig = data.date;

  if (Array.isArray(dateConfig)) {
    dateConfig.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (key !== "default") keys.add(key);
      });
      if (entry.default) keys.add("default");
    });
    return keys;
  }

  if (dateConfig) {
    Object.keys(dateConfig).forEach((key) => {
      if (key !== "default") keys.add(key);
    });
  }

  return keys;
}

function getIconProviders(data: FrontmatterData): Set<string> {
  if (Array.isArray(data.icons)) {
    return new Set(data.icons.flatMap((entry) => Object.keys(entry)));
  }

  return new Set(Object.keys(data.icons ?? {}));
}

function getImageNames(data: FrontmatterData): Set<string> {
  return new Set(Object.keys(data.images ?? {}));
}

function isMarkerLine(line: string): boolean {
  return line.startsWith("@");
}

function validateDateMarkers(
  content: string,
  dateKeys: Set<string>,
  issues: ValidationIssue[],
): void {
  const re = /@date(?::([A-Za-z0-9_-]+))?/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content))) {
    const key = match[1];
    if (key && !dateKeys.has(key)) {
      const line = content.slice(0, match.index).split(/\r?\n/).length;
      issues.push({ line, message: `unknown date format key "${key}"` });
    }
  }
}

function getDeclaredSections(data: FrontmatterData): string[] {
  return Object.values(data.regions ?? {}).flatMap((region) =>
    region.sections ?? []
  );
}

function collectPresentSections(content: string): Set<string> {
  const sections = new Set<string>();
  const headingRe = /^(?:@hidden\s+)?#{1,6}\s+.*\{\.([A-Za-z0-9_-]+)\}\s*$/;

  content.split(/\r?\n/).forEach((rawLine) => {
    const match = rawLine.trim().match(headingRe);
    if (match) sections.add(match[1]);
  });

  return sections;
}

export function validateDocument(
  content: string,
  data: FrontmatterData,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fieldNames = getFieldNames(data);
  const dateKeys = getDateKeys(data);
  const iconProviders = getIconProviders(data);
  const imageNames = getImageNames(data);
  const presentSections = collectPresentSections(content);

  content.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trimStart();
    if (!isMarkerLine(line)) return;

    const lineNumber = index + 1;
    const fieldMatch = line.match(
      /^@([A-Za-z0-9_-]+)(?::([A-Za-z0-9_-]+))?(?:\s+(.*))?$/,
    );
    if (!fieldMatch) return;

    const [, marker, qualifier, tail = ""] = fieldMatch;

    if (fieldNames.has(marker)) {
      if (!tail.trim()) {
        issues.push({ line: lineNumber, message: `empty field "${marker}"` });
      }
      return;
    }

    if (marker === "date") {
      if (qualifier && !dateKeys.has(qualifier)) {
        issues.push({
          line: lineNumber,
          message: `unknown date format key "${qualifier}"`,
        });
      }
      if (!tail.trim()) {
        issues.push({ line: lineNumber, message: "missing date value" });
      }
      return;
    }

    if (marker === "icon") {
      if (qualifier && !iconProviders.has(qualifier)) {
        issues.push({
          line: lineNumber,
          message: `unknown icon provider "${qualifier}"`,
        });
      }
      if (!tail.trim()) {
        issues.push({ line: lineNumber, message: "missing icon name" });
      }
      return;
    }

    if (marker === "image") {
      if (qualifier) {
        return;
      }

      const imageKey = tail.split("|")[0].trim();
      if (!imageNames.has(imageKey)) {
        issues.push({
          line: lineNumber,
          message: `unknown image key "${imageKey}"`,
        });
      }
      return;
    }

    if (BUILTIN_MARKERS.has(marker)) return;

    issues.push({ line: lineNumber, message: `unknown marker "${marker}"` });
  });

  validateDateMarkers(content, dateKeys, issues);

  getDeclaredSections(data).forEach((section) => {
    if (!presentSections.has(section)) {
      issues.push({
        message: `missing section "${section}" declared in frontmatter regions`,
      });
    }
  });

  return issues;
}
