import OpenAI from "openai";
import { z } from "zod";
import {
  type CVInput,
  type GeneratedContent,
  generatedContentSchema,
} from "@/lib/cv/schema";
import { createFallbackGeneratedContent } from "@/lib/cv/transform";

const aiResponseSchema = z.object({
  summary: z.string(),
  experience: z.array(
    z.object({
      bullets: z.array(z.string()).min(1).max(4),
    }),
  ),
  skills: z.array(z.string()).min(6).max(12),
});

function buildPrompt(input: CVInput) {
  return `Datos del candidato:
- Nombre: ${input.personal.fullName}
- Cargo objetivo: ${input.targetRole}
- Idioma: ${input.language}
- Tono: ${input.tone}
- GitHub: ${input.personal.github || "no informado"}
- Experiencia:
${input.experience
  .map(
    (item, index) =>
      `${index + 1}. ${item.role} en ${item.company} (${item.startDate} - ${item.endDate}): ${item.rawDescription}`,
  )
  .join("\n")}
- Educación: ${input.education
    .map((item) => `${item.degree}, ${item.institution}, ${item.year}`)
    .join("; ")}
- Habilidades mencionadas: ${input.rawSkills}

Instrucciones de redaccion:
- Si la experiencia raw es breve, conviertela en bullets profesionales sin inventar datos.
- Usa verbos de accion, alcance, tecnologias mencionadas y resultados cuando existan.
- No inventes metricas, empresas, cargos, certificaciones, anos ni tecnologias.
- Si no hay metricas, enfoca el impacto en claridad, colaboracion, calidad, entrega o mejora de procesos.
- Ajusta el lenguaje al cargo objetivo y a las habilidades mencionadas.

Genera JSON válido con esta forma exacta:
{
  "summary": "resumen profesional de máximo 3 oraciones",
  "experience": [
    { "bullets": ["2 a 4 bullets optimizados con accion, contexto e impacto real"] }
  ],
  "skills": ["8 a 10 habilidades técnicas y blandas relevantes"]
}`;
}

function mergeAiResponse(input: CVInput, payload: unknown): GeneratedContent {
  const parsed = aiResponseSchema.parse(payload);

  return generatedContentSchema.parse({
    summary: parsed.summary,
    experience: input.experience.map((item, index) => ({
      company: item.company,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate,
      bullets: parsed.experience[index]?.bullets ?? [],
    })),
    skills: parsed.skills,
  });
}

export async function generateContentWithAi(
  input: CVInput,
): Promise<{ provider: "openai" | "demo"; content: GeneratedContent }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      provider: "demo",
      content: createFallbackGeneratedContent(input),
    };
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres un experto en recursos humanos y redacción de CVs profesionales. Genera contenido conciso, orientado a logros. Responde solo con JSON válido, sin markdown.",
      },
      {
        role: "user",
        content: buildPrompt(input),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("OpenAI did not return content.");
  }

  return {
    provider: "openai",
    content: mergeAiResponse(input, JSON.parse(content)),
  };
}
