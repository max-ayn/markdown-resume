import type { ArgsDef } from "citty";

const args = {
  input: {
    type: "string",
    alias: "i",
    description: "Folder to read the markdown/stylesheet from",
    default: ".",
  },
  output: {
    type: "string",
    alias: "o",
    description: "Folder to write HTML/PDF output to",
    default: ".",
  },
  md: {
    type: "string",
    alias: "m",
    description: "Markdown filename, when the folder has more than one",
  },
  style: {
    type: "string",
    alias: "s",
    description: "Stylesheet filename, when the folder has more than one",
  },
  "with-pdf": {
    type: "boolean",
    description: "Also generate a PDF next to the HTML output",
    default: false,
  },
  watch: {
    type: "boolean",
    alias: "w",
    description:
      "Watch the input folder and re-render on change (Ctrl-C to stop)",
    default: false,
  },
  force: {
    type: "boolean",
    alias: "f",
    description: "Overwrite the output file if it already exists",
    default: false,
  },
} satisfies ArgsDef;

type Arg = keyof typeof args;

/**
 * Picks a subset of the shared field pool above, keeping each field's literal type.
 * Args are defined in `args.ts`
 */
export function defineArgs<const K extends readonly Arg[]>(
  argList: K,
): { [P in K[number]]: (typeof args)[P] } {
  return Object.fromEntries(argList.map((arg) => [arg, args[arg]])) as {
    [P in K[number]]: (typeof args)[P];
  };
}
