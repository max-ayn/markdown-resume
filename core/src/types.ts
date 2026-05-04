export type KnownFieldName =
  | "title"
  | "date"
  | "org"
  | "summary"
  | "image"
  | "links"
  | "stack"
  | "note"
  | "meta";

export type ValidationIssue = {
  code: string;
  message: string;
  line?: number;
};

export type ValidationResult = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};

export type RegionConfiguration = {
  enabled: boolean;
  sections: string[];
  props: Record<string, string>;
};

export type NormalizedConfiguration = {
  raw: Record<string, unknown>;
  regions: Record<string, RegionConfiguration>;
  sectionRegionMap: Record<string, string>;
  sectionRegionConflicts: Array<{
    sectionId: string;
    regions: string[];
  }>;
  defaultRegion: "main";
};

export type FieldAst = {
  name: string;
  value: string;
  hidden: boolean;
  known: boolean;
  line: number;
};

export type ListItemAst = {
  value: string;
  hidden: boolean;
  icon?: string;
  line: number;
};

export type MarkdownLineAst = {
  value: string;
  hidden: boolean;
  line: number;
};

export type BlockAttributesAst = {
  kind?: string;
  role?: string;
  variant?: string;
  region?: string;
  class?: string;
  props: Record<string, string>;
};

export type BlockAst = {
  type: "block";
  hidden: boolean;
  attrs: BlockAttributesAst;
  region: string;
  fields: FieldAst[];
  knownFields: Partial<Record<KnownFieldName, FieldAst[]>>;
  items: ListItemAst[];
  markdown: MarkdownLineAst[];
  children: BlockAst[];
  source: {
    startLine: number;
    endLine: number;
  };
};

export type SectionAst = {
  id: string;
  title: string;
  titleHidden: boolean;
  region: string;
  blocks: BlockAst[];
  markdown: MarkdownLineAst[];
  source: {
    headingLine: number;
  };
};

export type PreambleAst = {
  blocks: BlockAst[];
  markdown: MarkdownLineAst[];
};

export type ResumeAstDocument = {
  type: "resume-document";
  version: "core_bis/v1";
  config: NormalizedConfiguration;
  title?: string;
  preamble: PreambleAst;
  sections: SectionAst[];
  validation: ValidationResult;
};

export type ParseArtifacts = {
  ast: ResumeAstDocument;
  serializedAst: string;
};
