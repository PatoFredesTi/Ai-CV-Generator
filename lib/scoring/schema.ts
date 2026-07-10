import { z } from "zod";

export const scoreCategorySchema = z.object({
  technicalMatch: z.number().min(0).max(30).default(0),
  declaredLevelMatch: z.number().min(0).max(20).default(0),
  experienceMatch: z.number().min(0).max(20).default(0),
  seniorityMatch: z.number().min(0).max(10).default(0),
  impactEvidence: z.number().min(0).max(10).default(0),
  atsReadability: z.number().min(0).max(5).default(0),
  consistency: z.number().min(0).max(5).default(0),
});

export const cvImprovementSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  section: z.enum([
    "summary",
    "experience",
    "skills",
    "projects",
    "education",
    "general",
  ]),
  issue: z.string().trim().min(1),
  suggestion: z.string().trim().min(1),
});

export const cvScoreReportSchema = z.object({
  totalScore: z.number().int().min(1).max(100),
  categoryScores: scoreCategorySchema,
  verdict: z.string().trim().min(1),
  strengths: z.array(z.string().trim().min(1)).default([]),
  weaknesses: z.array(z.string().trim().min(1)).default([]),
  gaps: z.array(z.string().trim().min(1)).default([]),
  improvements: z.array(cvImprovementSchema).default([]),
});

export type ScoreCategory = z.infer<typeof scoreCategorySchema>;
export type CVImprovement = z.infer<typeof cvImprovementSchema>;
export type CVScoreReport = z.infer<typeof cvScoreReportSchema>;
