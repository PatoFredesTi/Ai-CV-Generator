import { z } from "zod";

export const templateSchema = z.enum(["classic", "modern", "minimal"]);
export const languageSchema = z.enum(["es", "en"]);
export const toneSchema = z.enum(["technical", "executive", "creative"]);

export const personalSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa el nombre completo."),
  email: z.string().trim().email("Ingresa un email válido."),
  phone: z.string().trim().min(6, "Ingresa un teléfono válido."),
  location: z.string().trim().min(2, "Ingresa una ubicación."),
  linkedIn: z.string().trim().optional().or(z.literal("")),
  website: z.string().trim().optional().or(z.literal("")),
});

export const experienceInputSchema = z.object({
  company: z.string().trim().min(2, "Ingresa la empresa."),
  role: z.string().trim().min(2, "Ingresa el rol."),
  startDate: z.string().trim().min(4, "Ingresa la fecha de inicio."),
  endDate: z.string().trim().min(4, "Ingresa la fecha de término."),
  rawDescription: z
    .string()
    .trim()
    .min(20, "Agrega más contexto para que la IA pueda optimizarlo."),
});

export const educationInputSchema = z.object({
  institution: z.string().trim().min(2, "Ingresa la institución."),
  degree: z.string().trim().min(2, "Ingresa el título o certificación."),
  year: z.string().trim().min(4, "Ingresa el año."),
});

export const cvInputSchema = z.object({
  personal: personalSchema,
  targetRole: z.string().trim().min(2, "Ingresa el cargo objetivo."),
  language: languageSchema.default("es"),
  tone: toneSchema.default("technical"),
  template: templateSchema.default("modern"),
  experience: z.array(experienceInputSchema).min(1).max(4),
  education: z.array(educationInputSchema).min(1).max(4),
  rawSkills: z
    .string()
    .trim()
    .min(5, "Ingresa al menos algunas habilidades separadas por coma."),
});

export const generatedExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string().min(4)).min(1).max(4),
});

export const generatedContentSchema = z.object({
  summary: z.string().min(20),
  experience: z.array(generatedExperienceSchema).min(1),
  skills: z.array(z.string().min(2)).min(6).max(12),
});

export const cvDataSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  personal: personalSchema,
  targetRole: z.string(),
  language: languageSchema,
  tone: toneSchema,
  template: templateSchema,
  summary: z.string(),
  experience: z.array(generatedExperienceSchema),
  education: z.array(educationInputSchema),
  skills: z.array(z.string()),
  rawInput: cvInputSchema.optional(),
});

export type CvTemplate = z.infer<typeof templateSchema>;
export type CVInput = z.infer<typeof cvInputSchema>;
export type CVInputFormValues = z.input<typeof cvInputSchema>;
export type GeneratedContent = z.infer<typeof generatedContentSchema>;
export type CVData = z.infer<typeof cvDataSchema>;
