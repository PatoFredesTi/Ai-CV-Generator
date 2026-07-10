import OpenAI from "openai";
import { z } from "zod";

export const improveExperienceModeSchema = z.enum(["fast", "polish"]);

export const improveExperienceInputSchema = z.object({
  rawDescription: z.string().trim().min(8),
  role: z.string().trim().optional().default(""),
  company: z.string().trim().optional().default(""),
  targetRole: z.string().trim().optional().default(""),
  language: z.enum(["es", "en"]).default("es"),
  mode: improveExperienceModeSchema.default("fast"),
  targetKeywords: z.array(z.string().trim().min(1)).max(8).optional().default([]),
  evidence: z.array(z.string().trim().min(1)).max(8).optional().default([]),
});

export const improveExperienceOutputSchema = z.object({
  improvedDescription: z.string().trim().min(20),
  bullets: z.array(z.string().trim().min(8)).min(1).max(4),
  warnings: z.array(z.string().trim()).max(5).default([]),
  provider: z.enum(["openai", "demo"]),
  model: z.string().trim().optional(),
  mode: improveExperienceModeSchema,
});

const aiExperienceResponseSchema = z.object({
  bullets: z.array(z.string().trim()).min(1).max(4),
  warnings: z.array(z.string().trim()).max(5).optional().default([]),
});

type ParsedImproveExperienceInput = z.output<
  typeof improveExperienceInputSchema
>;
type AiExperienceResponse = z.infer<typeof aiExperienceResponseSchema>;

export type ImproveExperienceInput = z.input<typeof improveExperienceInputSchema>;
export type ImproveExperienceOutput = z.infer<typeof improveExperienceOutputSchema>;

function splitNotes(value: string) {
  const lineNotes = value
    .split(/[\n;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (lineNotes.length > 1 || /^\s*[-*]/m.test(value)) {
    return lineNotes;
  }

  return value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeForCompare(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function stripBulletMarker(value: string) {
  return value.replace(/^\s*[-*]\s*/, "").trim();
}

function ensureSentence(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return trimmed;
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function looksLikeCompleteBullet(value: string) {
  const normalized = normalizeForCompare(stripBulletMarker(value));

  return (
    normalized.length >= 32 &&
    /^(desarroll|implement|constru|optim|mejor|lider|colabor|reduj|aument|migr|automat|document|coordin|disen|cre|integr|logr|alcanc|apoy|gestion|resolvi|mantuv|entreg)/.test(
      normalized,
    )
  );
}

function cleanRepeatedWords(value: string) {
  return value.replace(/\b([\p{L}]{3,})(?:\s+\1\b)+/giu, "$1");
}

function cleanKnownArtifacts(value: string) {
  return value
    .replace(/\bincorporando metricas\b/giu, "con foco en resultados")
    .replace(/\bmedido por evidencia cualitativa disponible\b/giu, "")
    .replace(/\bhaciendo mejoras enfocadas en calidad, colaboracion y entrega\b/giu, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const metricPattern =
  /\b\d+(?:[.,]\d+)?\s*(?:%|por ciento|x|k|m|ms|s|segundos?|minutos?|horas?|dias?|semanas?|meses?|usuarios?|clientes?|tickets?|leads?|ventas?|conversion(?:es)?|puntos?|requests?|solicitudes?)?\b/giu;

function normalizeMetric(value: string) {
  return value.replace(/\s+/g, "").replace(",", ".").toLowerCase();
}

function extractMetrics(value: string) {
  return Array.from(value.matchAll(metricPattern), (match) =>
    normalizeMetric(match[0]),
  ).filter(Boolean);
}

function removeUnsupportedMetrics(params: {
  bullet: string;
  sourceText: string;
  warnings: Set<string>;
  language: "es" | "en";
}) {
  const sourceMetrics = new Set(extractMetrics(params.sourceText));
  const unsupported = extractMetrics(params.bullet).filter(
    (metric) => !sourceMetrics.has(metric),
  );

  if (unsupported.length === 0) {
    return params.bullet;
  }

  params.warnings.add(
    params.language === "en"
      ? "Unsupported numeric metrics were removed from the rewrite."
      : "Se removieron metricas numericas que no estaban respaldadas por tus notas.",
  );

  return params.bullet
    .replace(metricPattern, (match) =>
      sourceMetrics.has(normalizeMetric(match)) ? match : "",
    )
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildSourceText(input: ParsedImproveExperienceInput) {
  return [
    input.rawDescription,
    input.role,
    input.company,
    input.targetRole,
    ...input.evidence,
  ].join("\n");
}

function cleanBullet(params: {
  bullet: string;
  input: ParsedImproveExperienceInput;
  warnings: Set<string>;
}) {
  const withoutMetrics = removeUnsupportedMetrics({
    bullet: params.bullet,
    sourceText: buildSourceText(params.input),
    warnings: params.warnings,
    language: params.input.language,
  });
  const cleaned = cleanKnownArtifacts(
    cleanRepeatedWords(stripBulletMarker(withoutMetrics)),
  );

  return ensureSentence(cleaned);
}

function uniqueBullets(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = normalizeForCompare(value).replace(/[^a-z0-9]+/g, " ").trim();

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createDemoBullets(input: ParsedImproveExperienceInput) {
  const notes = splitNotes(input.rawDescription);
  const base = notes.length > 0 ? notes : [input.rawDescription];
  const role = input.role || input.targetRole || "el rol";

  return base.slice(0, input.mode === "polish" ? 4 : 3).map((note, index) => {
    const cleaned = stripBulletMarker(note);

    if (looksLikeCompleteBullet(cleaned)) {
      return ensureSentence(cleaned);
    }

    if (index === 0) {
      return `Desarrolle ${cleaned}, conectando la ejecucion con objetivos del rol de ${role}.`;
    }

    if (index === 1) {
      return `Colabore con equipos internos para ejecutar ${cleaned}, manteniendo foco en calidad y entrega.`;
    }

    if (index === 2) {
      return `Optimice procesos relacionados con ${cleaned}, documentando avances y aprendizajes.`;
    }

    return `Apoye la mejora continua mediante ${cleaned}, conectando necesidades tecnicas y de negocio.`;
  });
}

export function sanitizeImprovedExperience(
  payload: AiExperienceResponse,
  input: ParsedImproveExperienceInput,
  provider: "openai" | "demo",
  model?: string,
): ImproveExperienceOutput {
  const warnings = new Set(payload.warnings);
  const fallbackBullets = createDemoBullets(input);
  const bullets = uniqueBullets(
    (payload.bullets.length > 0 ? payload.bullets : fallbackBullets)
      .map((bullet) => cleanBullet({ bullet, input, warnings }))
      .filter((bullet) => bullet.length >= 8),
  ).slice(0, input.mode === "polish" ? 4 : 3);
  const safeBullets = bullets.length > 0 ? bullets : fallbackBullets;

  return improveExperienceOutputSchema.parse({
    improvedDescription: safeBullets.map((bullet) => `- ${bullet}`).join("\n"),
    bullets: safeBullets,
    warnings: Array.from(warnings).slice(0, 5),
    provider,
    model,
    mode: input.mode,
  });
}

function demoImprove(input: ParsedImproveExperienceInput): ImproveExperienceOutput {
  return sanitizeImprovedExperience(
    { bullets: createDemoBullets(input), warnings: [] },
    input,
    "demo",
  );
}

function selectModel(mode: "fast" | "polish") {
  if (mode === "polish") {
    return (
      process.env.OPENAI_EXPERIENCE_MODEL_POLISH ||
      process.env.OPENAI_EXPERIENCE_MODEL_FAST ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini"
    );
  }

  return (
    process.env.OPENAI_EXPERIENCE_MODEL_FAST ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini"
  );
}

function buildPrompt(input: ParsedImproveExperienceInput) {
  const maxBullets = input.mode === "polish" ? 4 : 3;

  return `Devuelve JSON valido para mejorar una experiencia laboral de CV.

Reglas:
- Usa solo la informacion entregada por el usuario.
- No inventes metricas, empresas, cargos, certificaciones ni tecnologias.
- Si hay una metrica en las notas, puedes conservarla. Si no hay metrica, no crees porcentajes ni numeros.
- Si el usuario escribe muy poco, mejora claridad, verbo de accion, alcance y contexto sin exagerar.
- No empieces bullets con "Logre" si despues viene otro verbo conjugado.
- Evita duplicar verbos como "Desarrolle Desarrolle" o frases genericas como "evidencia cualitativa disponible".
- Devuelve ${input.mode === "polish" ? "3 a 4" : "2 a 3"} bullets concretos, ATS friendly y listos para CV.
- Cada bullet debe tener accion, contexto real y resultado/impacto honesto.
- Idioma: ${input.language}

Cargo en la experiencia: ${input.role || "no especificado"}
Empresa: ${input.company || "no especificada"}
Cargo objetivo: ${input.targetRole || "no especificado"}
Modo: ${input.mode}
Keywords objetivo disponibles: ${input.targetKeywords.join(", ") || "no informadas"}
Evidencia adicional del usuario:
${input.evidence.length > 0 ? input.evidence.map((item) => `- ${item}`).join("\n") : "no informada"}

Notas raw del usuario:
${input.rawDescription}

Formato JSON exacto:
{
  "bullets": ["maximo ${maxBullets} bullets, sin markdown"],
  "warnings": ["solo si falta evidencia o el texto es demasiado ambiguo"]
}`;
}

export async function improveExperienceWriting(
  input: ImproveExperienceInput,
): Promise<ImproveExperienceOutput> {
  const parsed = improveExperienceInputSchema.parse(input);

  if (!process.env.OPENAI_API_KEY) {
    return demoImprove(parsed);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const model = selectModel(parsed.mode);

  const completion = await client.chat.completions.create({
    model,
    temperature: parsed.mode === "polish" ? 0.35 : 0.2,
    max_tokens: parsed.mode === "polish" ? 650 : 420,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres editor senior de CVs tecnicos. Mejoras redaccion sin inventar datos. Responde solo JSON valido.",
      },
      {
        role: "user",
        content: buildPrompt(parsed),
      },
    ],
  });

  const content = completion.choices[0]?.message.content?.trim();

  if (!content) {
    throw new Error("OpenAI did not return improved experience content.");
  }

  return sanitizeImprovedExperience(
    aiExperienceResponseSchema.parse(JSON.parse(content)),
    parsed,
    "openai",
    model,
  );
}
