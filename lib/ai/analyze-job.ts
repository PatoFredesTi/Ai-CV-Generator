import OpenAI from "openai";
import {
  type JobAnalysis,
  type JobOfferInput,
  jobAnalysisSchema,
  jobOfferInputSchema,
} from "@/lib/job/schema";

const demoAnalysis: JobAnalysis = {
  roleTitle: "Frontend Developer",
  company: "Demo SaaS",
  seniority: "mid",
  modality: "remote",
  contractType: "Full-time",
  requiredSkills: ["React", "TypeScript", "Next.js", "APIs REST"],
  niceToHaveSkills: ["Docker", "AWS", "Testing Library"],
  responsibilities: [
    "Construir interfaces web escalables.",
    "Integrar APIs y colaborar con producto y diseno.",
    "Mantener buenas practicas de testing y performance.",
  ],
  keywords: [
    "React",
    "TypeScript",
    "Next.js",
    "testing",
    "performance",
    "frontend",
  ],
  detectedStack: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
  softSkills: ["comunicacion", "colaboracion", "autonomia"],
  domain: "SaaS",
};

function buildPrompt(input: JobOfferInput) {
  return `Analiza la siguiente oferta laboral y extrae informacion estructurada.

Debes identificar:
- Cargo.
- Empresa, si aparece.
- Seniority.
- Modalidad.
- Tipo de contrato.
- Tecnologias obligatorias.
- Tecnologias deseables.
- Herramientas.
- Frameworks.
- Bases de datos.
- Cloud providers.
- Metodologias.
- Responsabilidades principales.
- Habilidades blandas.
- Keywords ATS relevantes.
- Dominio o industria.

No inventes informacion. Si algo no aparece, usa "unknown", omite el campo opcional o usa un array vacio.
Devuelve solo JSON valido compatible con esta forma:
{
  "roleTitle": "string",
  "company": "string opcional",
  "seniority": "intern | junior | mid | senior | lead | unknown",
  "modality": "remote | hybrid | onsite | unknown",
  "contractType": "string opcional",
  "requiredSkills": ["string"],
  "niceToHaveSkills": ["string"],
  "responsibilities": ["string"],
  "keywords": ["string"],
  "detectedStack": ["string"],
  "softSkills": ["string"],
  "domain": "string opcional"
}

Idioma objetivo: ${input.targetLanguage}
Oferta:
${input.rawText}`;
}

export async function analyzeJobOffer(input: JobOfferInput): Promise<JobAnalysis> {
  const parsedInput = jobOfferInputSchema.parse(input);

  if (!process.env.OPENAI_API_KEY) {
    return jobAnalysisSchema.parse(demoAnalysis);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres un analista experto en ofertas laborales y ATS. Responde solo con JSON valido, sin markdown.",
      },
      {
        role: "user",
        content: buildPrompt(parsedInput),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("OpenAI did not return job analysis content.");
  }

  return jobAnalysisSchema.parse(JSON.parse(content));
}
