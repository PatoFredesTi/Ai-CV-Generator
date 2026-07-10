import { adaptedCvSchema, type AdaptedCV } from "@/lib/cv/adapted-schema";
import {
  latexOutputSchema,
  type LatexOutput,
  type LatexTemplateId,
} from "@/lib/latex/schema";
import { renderAtsModernTemplate } from "@/lib/latex/templates/ats-modern";
import { renderClassicDevTemplate } from "@/lib/latex/templates/classic-dev";
import { renderCompactSeniorTemplate } from "@/lib/latex/templates/compact-senior";

export function renderLatex(params: {
  cv: AdaptedCV;
  templateId: LatexTemplateId;
}): LatexOutput {
  const cv = adaptedCvSchema.parse(params.cv);
  const templateId = params.templateId;
  const latexSource =
    templateId === "classic-dev"
      ? renderClassicDevTemplate(cv)
      : templateId === "compact-senior"
        ? renderCompactSeniorTemplate(cv)
        : renderAtsModernTemplate(cv);

  return latexOutputSchema.parse({
    templateId,
    latexSource,
    pdfUrl: null,
  });
}
