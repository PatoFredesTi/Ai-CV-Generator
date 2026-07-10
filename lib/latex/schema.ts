import { z } from "zod";

export const latexTemplateIdSchema = z.enum([
  "ats-modern",
  "classic-dev",
  "compact-senior",
]);

export const latexOutputSchema = z.object({
  templateId: latexTemplateIdSchema,
  latexSource: z.string().min(20),
  pdfUrl: z.string().url().optional().nullable(),
});

export type LatexTemplateId = z.infer<typeof latexTemplateIdSchema>;
export type LatexOutput = z.infer<typeof latexOutputSchema>;
