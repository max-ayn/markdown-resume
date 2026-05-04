export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function stripQuotes(input: string): string {
  const value = input.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function parseBoolean(input: string): boolean | null {
  const value = input.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}
