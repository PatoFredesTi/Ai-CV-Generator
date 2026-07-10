import { z } from "zod";
import { adaptedCvSchema } from "@/lib/cv/adapted-schema";
import { jobAnalysisSchema, jobRequirementsSchema } from "@/lib/job/schema";
import { cvScoreReportSchema } from "@/lib/scoring/schema";

export const reviewStepIdSchema = z.enum([
  "senior_recruiter_audit",
  "xyz_experience_rewrite",
  "ats_hiring_manager_scan",
  "ats_style_review",
  "final_reassessment",
]);

export const recruiterAuditSchema = z.object({
  compatibilityScore: z.number().int().min(1).max(100),
  missingKeywords: z.array(z.string().trim().min(1)).max(5).default([]),
  redFlags: z.array(z.string().trim().min(1)).max(3).default([]),
  recruiterSummary: z.string().trim().min(1),
});

export const ignoredSectionSchema = z.object({
  section: z.enum([
    "summary",
    "experience",
    "skills",
    "projects",
    "education",
    "general",
  ]),
  reason: z.string().trim().min(1),
  rewrite: z.string().trim().min(1),
});

export const reviewLoopVersionSchema = z.object({
  id: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  stepId: reviewStepIdSchema,
  title: z.string().trim().min(1),
  scoreBefore: z.number().int().min(1).max(100).optional(),
  scoreAfter: z.number().int().min(1).max(100).optional(),
  notes: z.array(z.string().trim().min(1)).default([]),
});

export const reviewLoopStateSchema = z.object({
  currentCv: adaptedCvSchema,
  recruiterAudit: recruiterAuditSchema.optional(),
  finalAudit: recruiterAuditSchema.optional(),
  ignoredSections: z.array(ignoredSectionSchema).default([]),
  versions: z.array(reviewLoopVersionSchema).default([]),
  warnings: z.array(z.string().trim().min(1)).default([]),
});

export const reviewLoopRequestSchema = z.object({
  stepId: reviewStepIdSchema,
  cv: adaptedCvSchema,
  jobAnalysis: jobAnalysisSchema,
  requirements: jobRequirementsSchema,
  scoreReport: cvScoreReportSchema.optional(),
  previousState: reviewLoopStateSchema.optional(),
});

export const reviewLoopResponseSchema = z.object({
  state: reviewLoopStateSchema,
  stepSummary: z.string().trim().min(1),
});

export type ReviewStepId = z.infer<typeof reviewStepIdSchema>;
export type RecruiterAudit = z.infer<typeof recruiterAuditSchema>;
export type IgnoredSection = z.infer<typeof ignoredSectionSchema>;
export type ReviewLoopVersion = z.infer<typeof reviewLoopVersionSchema>;
export type ReviewLoopState = z.infer<typeof reviewLoopStateSchema>;
export type ReviewLoopRequest = z.infer<typeof reviewLoopRequestSchema>;
export type ReviewLoopResponse = z.infer<typeof reviewLoopResponseSchema>;
