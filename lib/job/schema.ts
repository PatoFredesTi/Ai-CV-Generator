import { z } from "zod";

export const targetLanguageSchema = z.enum(["es", "en"]);

export const senioritySchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "unknown",
]);

export const modalitySchema = z.enum([
  "remote",
  "hybrid",
  "onsite",
  "unknown",
]);

export const requirementCategorySchema = z.enum([
  "language",
  "framework",
  "database",
  "cloud",
  "devops",
  "architecture",
  "methodology",
  "soft_skill",
  "tool",
  "other",
]);

export const requirementImportanceSchema = z.enum([
  "required",
  "nice_to_have",
]);

export const userLevelSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const stringListSchema = z.array(z.string().trim().min(1)).default([]);

export const jobOfferInputSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(100, "Pega una oferta laboral de al menos 100 caracteres."),
  targetLanguage: targetLanguageSchema.default("es"),
});

export const jobAnalysisSchema = z.object({
  roleTitle: z.string().trim().min(1).default("Rol no especificado"),
  company: z.string().trim().optional(),
  seniority: senioritySchema.default("unknown"),
  modality: modalitySchema.default("unknown").optional(),
  contractType: z.string().trim().optional(),
  requiredSkills: stringListSchema,
  niceToHaveSkills: stringListSchema,
  responsibilities: stringListSchema,
  keywords: stringListSchema,
  detectedStack: stringListSchema,
  softSkills: stringListSchema,
  domain: z.string().trim().optional(),
});

export const jobRequirementSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "El requerimiento necesita un nombre."),
  category: requirementCategorySchema.default("other"),
  importance: requirementImportanceSchema.default("required"),
  detectedFromOffer: z.boolean().default(true),
  userLevel: userLevelSchema.default(0),
  evidence: stringListSchema.optional(),
});

export const jobRequirementsSchema = z.array(jobRequirementSchema);

export type TargetLanguage = z.infer<typeof targetLanguageSchema>;
export type JobOfferInput = z.infer<typeof jobOfferInputSchema>;
export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;
export type JobRequirement = z.infer<typeof jobRequirementSchema>;
export type RequirementCategory = z.infer<typeof requirementCategorySchema>;
export type RequirementImportance = z.infer<typeof requirementImportanceSchema>;
export type UserLevel = z.infer<typeof userLevelSchema>;
