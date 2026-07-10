import { z } from "zod";
import {
  cvDataSchema,
  educationInputSchema,
  generatedExperienceSchema,
  personalSchema,
  templateSchema,
  type CVData,
} from "@/lib/cv/schema";

export const skillGroupSchema = z.object({
  name: z.string().trim().min(1),
  items: z.array(z.string().trim().min(1)).default([]),
});

export const projectItemSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).optional(),
  technologies: z.array(z.string().trim().min(1)).default([]),
  bullets: z.array(z.string().trim().min(1)).default([]),
  url: z.string().trim().optional(),
});

export const certificationItemSchema = z.object({
  name: z.string().trim().min(1),
  issuer: z.string().trim().optional(),
  year: z.string().trim().optional(),
});

export const languageItemSchema = z.object({
  name: z.string().trim().min(1),
  level: z.string().trim().min(1),
});

export const extraSectionSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  items: z.array(z.string().trim().min(1)).default([]),
});

export const adaptedCvSchema = z.object({
  personalInfo: personalSchema,
  template: templateSchema.optional(),
  targetRole: z.string().trim().min(1),
  summary: z.string().trim().min(20),
  experience: z.array(generatedExperienceSchema).min(1),
  skills: z.array(skillGroupSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  education: z.array(educationInputSchema).default([]),
  certifications: z.array(certificationItemSchema).default([]),
  languages: z.array(languageItemSchema).default([]),
  extraSections: z.array(extraSectionSchema).default([]),
  warnings: z.array(z.string().trim().min(1)).default([]),
});

export function adaptedCvToCvData(
  cv: AdaptedCV,
  options: Partial<Pick<CVData, "id" | "createdAt" | "template" | "language" | "tone">> = {},
): CVData {
  return cvDataSchema.parse({
    id: options.id ?? "adapted-cv",
    createdAt: options.createdAt ?? new Date().toISOString(),
    personal: cv.personalInfo,
    targetRole: cv.targetRole,
    language: options.language ?? "es",
    tone: options.tone ?? "technical",
    template: options.template ?? cv.template ?? "modern",
    summary: cv.summary,
    experience: cv.experience,
    education: cv.education,
    skills: cv.skills.flatMap((group) => group.items).slice(0, 12),
  });
}

export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type CertificationItem = z.infer<typeof certificationItemSchema>;
export type LanguageItem = z.infer<typeof languageItemSchema>;
export type ExtraSection = z.infer<typeof extraSectionSchema>;
export type AdaptedCV = z.infer<typeof adaptedCvSchema>;
