import { adaptedCvSchema, type AdaptedCV } from "@/lib/cv/adapted-schema";
import { type CVData } from "@/lib/cv/schema";
import {
  jobAnalysisSchema,
  jobRequirementsSchema,
  type JobAnalysis,
  type JobRequirement,
} from "@/lib/job/schema";
import { cvScoreReportSchema, type CVScoreReport } from "@/lib/scoring/schema";
import { reviewLoopStateSchema, type ReviewLoopState } from "@/lib/review/schema";

export const CV_HISTORY_KEY = "cv-history";
export const JOB_ANALYSIS_KEY = "latex-cv-job-analysis";
export const REQUIREMENTS_KEY = "latex-cv-requirements";
export const SCORE_REPORT_KEY = "latex-cv-score-report";
export const ADAPTED_CV_KEY = "latex-cv-adapted-cv";
export const REVIEW_LOOP_KEY = "latex-cv-review-loop";
export const LATEX_OUTPUT_KEY = "latex-cv-output";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLatestCv() {
  const history = readJson<CVData[]>(CV_HISTORY_KEY, []);
  return history[0] ?? null;
}

export function readJobAnalysis(): JobAnalysis | null {
  const value = readJson<unknown | null>(JOB_ANALYSIS_KEY, null);
  const parsed = jobAnalysisSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readRequirements(): JobRequirement[] {
  const value = readJson<unknown>(REQUIREMENTS_KEY, []);
  const parsed = jobRequirementsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function readScoreReport(): CVScoreReport | null {
  const value = readJson<unknown | null>(SCORE_REPORT_KEY, null);
  const parsed = cvScoreReportSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readAdaptedCv(): AdaptedCV | null {
  const value = readJson<unknown | null>(ADAPTED_CV_KEY, null);
  const parsed = adaptedCvSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function readReviewLoopState(): ReviewLoopState | null {
  const value = readJson<unknown | null>(REVIEW_LOOP_KEY, null);
  const parsed = reviewLoopStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
