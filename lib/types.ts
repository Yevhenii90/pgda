export const analysisModes = [
  "Balanced",
  "Critical",
  "Practical",
  "Fast check",
] as const;

export type AnalysisMode = (typeof analysisModes)[number];

export type AnalysisResult = {
  title: string;
  overall_assessment: string;
  strengths: string[];
  risks: string[];
  assumptions: string[];
  improvements: string[];
  alternatives: string[];
  hard_questions: string[];
};

export type HistoryItem = {
  id: string;
  decision: string;
  context: string;
  mode: AnalysisMode;
  result: AnalysisResult;
  createdAt: string;
};

export type AnalyzeRequest = {
  decision: string;
  context: string;
  mode: AnalysisMode;
};

const resultKeys: Array<keyof AnalysisResult> = [
  "title",
  "overall_assessment",
  "strengths",
  "risks",
  "assumptions",
  "improvements",
  "alternatives",
  "hard_questions",
];

export function isAnalysisMode(value: unknown): value is AnalysisMode {
  return typeof value === "string" && analysisModes.includes(value as AnalysisMode);
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return resultKeys.every((key) => {
    const field = candidate[key];

    if (key === "title" || key === "overall_assessment") {
      return typeof field === "string";
    }

    return Array.isArray(field) && field.every((item) => typeof item === "string");
  });
}
