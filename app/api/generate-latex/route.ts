import { adaptedCvSchema } from "@/lib/cv/adapted-schema";
import { renderLatex } from "@/lib/latex/render-latex";
import { latexTemplateIdSchema } from "@/lib/latex/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedCv = adaptedCvSchema.safeParse(body?.cv);
  const parsedTemplate = latexTemplateIdSchema.safeParse(
    body?.templateId ?? "ats-modern",
  );

  if (!parsedCv.success || !parsedTemplate.success) {
    return Response.json(
      { message: "Los datos enviados no permiten generar LaTeX." },
      { status: 400 },
    );
  }

  const output = renderLatex({
    cv: parsedCv.data,
    templateId: parsedTemplate.data,
  });

  return Response.json(output);
}
