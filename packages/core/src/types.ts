export type FrontmatterData = {
  custom?: {
    field?: string[];
  };
  date?: Array<Record<string, string>> | Record<string, string>;
  icons?: Array<Record<string, unknown>> | Record<string, unknown>;
  images?: Record<string, string>;
  regions?: Record<
    string,
    {
      enabled?: boolean;
      sections?: string[];
    }
  >;
  render?: {
    output_path?: string;
  };
  page?: {
    size?: string;
    margin?: string | number;
  };
  font?: {
    family?: string;
  };
  /** Warn on render if content overflows one physical page. Defaults to false. */
  single_page?: boolean;
  [key: string]: unknown;
};

export type ValidationIssue = {
  line?: number;
  message: string;
};

export type RenderResult = {
  data: FrontmatterData;
  html: string;
  issues: ValidationIssue[];
};
