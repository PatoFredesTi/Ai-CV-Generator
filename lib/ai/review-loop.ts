import OpenAI from "openai";
import {
  adaptedCvSchema,
  type AdaptedCV,
  type SkillGroup,
} from "@/lib/cv/adapted-schema";
import { adaptedCvToCvData } from "@/lib/cv/adapted-schema";
import { type JobRequirement } from "@/lib/job/schema";
import { normalizeSearchText } from "@/lib/scoring/keyword-match";
import { calculateCVScore } from "@/lib/scoring/calculate-score";
import {
  type IgnoredSection,
  type RecruiterAudit,
  type ReviewLoopRequest,
  type ReviewLoopResponse,
  reviewLoopRequestSchema,
  reviewLoopResponseSchema,
} from "@/lib/review/schema";

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `review-${Date.now()}`;
}

function cvText(cv: AdaptedCV) {
  return normalizeSearchText(
    [
      cv.targetRole,
      cv.summary,
      cv.experience.map((item) => item.bullets.join(" ")).join(" "),
      cv.skills.flatMap((group) => group.items).join(" "),
      cv.projects.map((project) => `${project.name} ${project.description ?? ""}`).join(" "),
      cv.languages.map((item) => `${item.name} ${item.level}`).join(" "),
      cv.certifications.map((item) => `${item.name} ${item.issuer ?? ""}`).join(" "),
      cv.extraSections.map((section) => `${section.title} ${section.items.join(" ")}`).join(" "),
    ].join(" "),
  );
}

function missingKeywords(cv: AdaptedCV, requirements: JobRequirement[]) {
  const text = cvText(cv);

  return requirements
    .filter((requirement) => requirement.userLevel > 0)
    .map((requirement) => requirement.name)
    .filter((name) => !text.includes(normalizeSearchText(name)))
    .slice(0, 5);
}

function redFlags(cv: AdaptedCV, requirements: JobRequirement[]) {
  const flags: string[] = [];
  const metricPattern = /\d+\s?%|\b\d+x\b|\b\d+\s?(usuarios|clientes|horas|dias|semanas|meses|usd|clp)\b/i;
  const bullets = cv.experience.flatMap((item) => item.bullets);

  if (!bullets.some((bullet) => metricPattern.test(bullet))) {
    flags.push("Pocos logros medibles; el impacto puede verse generico en una lectura rapida.");
  }

  const zeroRequired = requirements.filter(
    (requirement) =>
      requirement.importance === "required" && requirement.userLevel === 0,
  );
  if (zeroRequired.length > 0) {
    flags.push(
      `Brecha en requisito obligatorio: ${zeroRequired
        .slice(0, 2)
        .map((item) => item.name)
        .join(", ")}.`,
    );
  }

  if (cv.summary.length > 360) {
    flags.push("Resumen demasiado largo; puede perder fuerza antes de mostrar el valor principal.");
  }

  if (flags.length < 3 && cv.skills.flatMap((group) => group.items).length < 6) {
    flags.push("Seccion de skills poco densa para un filtro rapido ATS/reclutador.");
  }

  if (flags.length < 3) {
    flags.push("Algunos bullets describen tareas, pero no dejan claro el resultado de negocio.");
  }

  return flags.slice(0, 3);
}

function auditCv(params: ReviewLoopRequest): RecruiterAudit {
  const cvData = adaptedCvToCvData(params.cv, {
    id: "review-cv",
  });
  const score = calculateCVScore({
    cv: cvData,
    jobAnalysis: params.jobAnalysis,
    requirements: params.requirements,
  }).totalScore;
  const missing = missingKeywords(params.cv, params.requirements);
  const flags = redFlags(params.cv, params.requirements);

  return {
    compatibilityScore: score,
    missingKeywords: missing.length > 0 ? missing : ["metricas", "impacto", "ownership"],
    redFlags: flags,
    recruiterSummary:
      score >= 82
        ? "El CV esta bien alineado con la oferta; el foco ahora es reforzar evidencia medible y claridad de impacto."
        : "El CV tiene una base prometedora, pero debe conectar mejor experiencia, keywords y resultados verificables.",
  };
}

function metricFromBullet(bullet: string) {
  const metric = bullet.match(/\d+\s?%|\b\d+x\b|\b\d+\s?(usuarios|clientes|horas|dias|semanas|meses|usd|clp)\b/i);
  return metric?.[0] ?? null;
}

function cleanBulletForXyz(bullet: string) {
  let cleaned = bullet
    .replace(/^[-•]\s*/, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .trim();

  const leadingVerbPattern =
    /^(logre|logré|desarrolle|desarrollé|colabore|colaboré|optimice|optimicé|ejecute|ejecuté|implemente|implementé|mejore|mejoré|reduje|aumente|aumenté)\s+/i;

  while (leadingVerbPattern.test(cleaned)) {
    cleaned = cleaned.replace(leadingVerbPattern, "").trim();
  }

  return cleaned
    .replace(/^iniciativas clave como\s+/i, "")
    .replace(/^acciones clave como\s+/i, "")
    .replace(/^alineadas? al rol de [^,.]+[,.]?\s*/i, "")
    .replace(/\bdesarrolle\s+desarrolle\b/gi, "desarrolle")
    .replace(/\blogre\s+logre\b/gi, "logre")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim();
}

function usefulKeyword(keyword?: string) {
  if (!keyword) {
    return "";
  }

  const normalized = normalizeSearchText(keyword);
  const generic = ["metricas", "impacto", "ownership", "evidencia", "resultados"];

  return generic.includes(normalized) ? "" : keyword;
}

function rewriteExperienceXyz(cv: AdaptedCV, audit?: RecruiterAudit): {
  cv: AdaptedCV;
  warnings: string[];
} {
  const keywords = audit?.missingKeywords ?? [];
  const warnings: string[] = [];
  let keywordIndex = 0;

  const experience = cv.experience.map((item) => ({
    ...item,
    bullets: item.bullets.map((bullet) => {
      const metric = metricFromBullet(bullet);
      const keyword = usefulKeyword(keywords[keywordIndex % Math.max(keywords.length, 1)]);
      keywordIndex += 1;
      const cleaned = cleanBulletForXyz(bullet);

      if (!metric) {
        warnings.push(
          `No se invento metrica para "${item.role}" en ${item.company}; agrega un numero real si lo tienes.`,
        );
      }

      const measuredBy = metric
        ? `medido por ${metric}`
        : "medido por evidencia cualitativa declarada";
      const outcome = keyword
        ? `fortalecer ${keyword}`
        : metric
          ? "mejorar un resultado medible"
          : "mejorar la ejecucion del proyecto";

      return `Logre ${outcome}, ${measuredBy}, haciendo ${cleaned}.`;
    }),
  }));

  return {
    cv: adaptedCvSchema.parse({
      ...cv,
      experience,
      warnings: unique([...cv.warnings, ...warnings]),
    }),
    warnings,
  };
}

function improveSkillGroups(cv: AdaptedCV, audit?: RecruiterAudit): SkillGroup[] {
  const currentGroups = cv.skills.length > 0
    ? cv.skills
    : [{ name: "Skills", items: [] }];
  const missing = audit?.missingKeywords ?? [];

  return currentGroups.map((group, index) => {
    if (index > 0) {
      return group;
    }

    return {
      ...group,
      items: unique([...group.items, ...missing]).slice(0, 12),
    };
  });
}

function atsScanAndRewrite(cv: AdaptedCV, audit?: RecruiterAudit): {
  cv: AdaptedCV;
  ignoredSections: IgnoredSection[];
  warnings: string[];
} {
  const ignoredSections: IgnoredSection[] = [];
  const warnings: string[] = [];
  const keywordLine = audit?.missingKeywords?.slice(0, 3).join(", ");
  const summaryRewrite = `${cv.summary} En lectura ATS se priorizan resultados, stack relevante y evidencia alineada a ${cv.targetRole}${keywordLine ? `, especialmente ${keywordLine}` : ""}.`;

  if (cv.summary.length < 120 || cv.summary.length > 420) {
    ignoredSections.push({
      section: "summary",
      reason: "El resumen puede ser saltado si no concentra cargo, stack y valor diferencial rapidamente.",
      rewrite: summaryRewrite,
    });
  }

  const hasLongBullets = cv.experience.some((item) =>
    item.bullets.some((bullet) => bullet.length > 220),
  );
  if (hasLongBullets) {
    ignoredSections.push({
      section: "experience",
      reason: "Bullets demasiado largos reducen lectura rapida en un lote grande de CVs.",
      rewrite: "Usar bullets de una idea: logro, evidencia y tecnologia principal.",
    });
  }

  if (cv.skills.flatMap((group) => group.items).length < 8) {
    ignoredSections.push({
      section: "skills",
      reason: "La seccion de skills puede quedar debil frente a ATS si no incluye suficientes keywords reales.",
      rewrite: "Priorizar skills comprobables y keywords de la oferta en el primer grupo.",
    });
  }

  if (ignoredSections.length === 0) {
    ignoredSections.push({
      section: "general",
      reason: "La estructura es legible, pero conviene reforzar el primer pantallazo con impacto y keywords.",
      rewrite: "Mantener una primera pagina con resumen breve, skills prioritarias y bullets con evidencia.",
    });
  }

  if (!audit?.missingKeywords?.length) {
    warnings.push("No se detectaron keywords faltantes claras; se aplicaron mejoras de foco y lectura.");
  }

  return {
    cv: adaptedCvSchema.parse({
      ...cv,
      summary: summaryRewrite,
      skills: improveSkillGroups(cv, audit),
      warnings: unique([...cv.warnings, ...warnings]),
    }),
    ignoredSections,
    warnings,
  };
}

function atsStyleReview(cv: AdaptedCV, audit?: RecruiterAudit): {
  cv: AdaptedCV;
  ignoredSections: IgnoredSection[];
  warnings: string[];
} {
  const ignoredSections: IgnoredSection[] = [];
  const warnings: string[] = [];
  const keywordFocus = audit?.missingKeywords?.slice(0, 3) ?? [];
  const summary = cv.summary.length > 420
    ? `${cv.summary.slice(0, 360).trim()}...`
    : cv.summary;
  const experience = cv.experience.map((item) => ({
    ...item,
    bullets: item.bullets.map((bullet) => {
      const compact = bullet.length > 230
        ? `${bullet.slice(0, 210).trim()}...`
        : bullet;

      return compact
        .replace(/\s+/g, " ")
        .replace(/,\s*,/g, ",")
        .trim();
    }),
  }));

  if (cv.summary.length > 420) {
    ignoredSections.push({
      section: "summary",
      reason: "El resumen excedia una lectura ATS rapida.",
      rewrite: summary,
    });
  }

  if (keywordFocus.length > 0) {
    ignoredSections.push({
      section: "skills",
      reason: "Conviene que las keywords prioritarias aparezcan temprano en skills o experiencia.",
      rewrite: `Priorizar keywords comprobables: ${keywordFocus.join(", ")}.`,
    });
  }

  const hasContactLinks =
    Boolean(cv.personalInfo.linkedIn) &&
    Boolean(cv.personalInfo.github) &&
    Boolean(cv.personalInfo.website);

  if (!hasContactLinks) {
    warnings.push("La cabecera ideal debe incluir LinkedIn, GitHub y portfolio si existen.");
  }

  return {
    cv: adaptedCvSchema.parse({
      ...cv,
      summary,
      experience,
      template: cv.template,
      warnings: unique([...cv.warnings, ...warnings]),
    }),
    ignoredSections:
      ignoredSections.length > 0
        ? ignoredSections
        : [
            {
              section: "general",
              reason: "El estilo es compatible con ATS; se conservaron template y jerarquia visual.",
              rewrite: "Mantener encabezado con links, resumen breve, skills claras y bullets escaneables.",
            },
          ],
    warnings,
  };
}

function addVersion(params: {
  request: ReviewLoopRequest;
  title: string;
  scoreBefore?: number;
  scoreAfter?: number;
  notes?: string[];
}) {
  return {
    id: createId(),
    createdAt: new Date().toISOString(),
    stepId: params.request.stepId,
    title: params.title,
    scoreBefore: params.scoreBefore,
    scoreAfter: params.scoreAfter,
    notes: params.notes ?? [],
  };
}

function demoRunReviewStep(request: ReviewLoopRequest): ReviewLoopResponse {
  const previousState = request.previousState;
  const baseState = previousState ?? {
    currentCv: request.cv,
    versions: [],
    ignoredSections: [],
    warnings: [],
  };
  const currentCv = previousState?.currentCv ?? request.cv;
  const initialAudit = previousState?.recruiterAudit ?? auditCv({ ...request, cv: currentCv });
  const scoreBefore = initialAudit.compatibilityScore;

  if (request.stepId === "senior_recruiter_audit") {
    const audit = auditCv({ ...request, cv: currentCv });

    return reviewLoopResponseSchema.parse({
      state: {
        ...baseState,
        currentCv,
        recruiterAudit: audit,
        versions: [
          ...baseState.versions,
          addVersion({
            request,
            title: "Auditoria de reclutador senior",
            scoreAfter: audit.compatibilityScore,
            notes: [...audit.missingKeywords, ...audit.redFlags],
          }),
        ],
      },
      stepSummary: "Auditoria inicial completada con score, keywords faltantes y senales de alerta.",
    });
  }

  if (request.stepId === "xyz_experience_rewrite") {
    const rewritten = rewriteExperienceXyz(currentCv, initialAudit);
    const auditAfter = auditCv({ ...request, cv: rewritten.cv });

    return reviewLoopResponseSchema.parse({
      state: {
        ...baseState,
        currentCv: rewritten.cv,
        recruiterAudit: initialAudit,
        warnings: unique([...baseState.warnings, ...rewritten.warnings]),
        versions: [
          ...baseState.versions,
          addVersion({
            request,
            title: "Experiencia reescrita con formula X/Y/Z",
            scoreBefore,
            scoreAfter: auditAfter.compatibilityScore,
            notes: rewritten.warnings,
          }),
        ],
      },
      stepSummary: "Experiencia profesional reescrita con formula X/Y/Z sin inventar metricas.",
    });
  }

  if (request.stepId === "ats_hiring_manager_scan") {
    const scanned = atsScanAndRewrite(currentCv, initialAudit);
    const auditAfter = auditCv({ ...request, cv: scanned.cv });

    return reviewLoopResponseSchema.parse({
      state: {
        ...baseState,
        currentCv: scanned.cv,
        recruiterAudit: initialAudit,
        ignoredSections: scanned.ignoredSections,
        warnings: unique([...baseState.warnings, ...scanned.warnings]),
        versions: [
          ...baseState.versions,
          addVersion({
            request,
            title: "Escaneo ATS y gerente de contratacion",
            scoreBefore,
            scoreAfter: auditAfter.compatibilityScore,
            notes: scanned.ignoredSections.map((item) => item.reason),
          }),
        ],
      },
      stepSummary: "Escaneo ATS completado; se reescribieron zonas con riesgo de ser ignoradas.",
    });
  }

  if (request.stepId === "ats_style_review") {
    const reviewed = atsStyleReview(currentCv, initialAudit);
    const auditAfter = auditCv({ ...request, cv: reviewed.cv });

    return reviewLoopResponseSchema.parse({
      state: {
        ...baseState,
        currentCv: reviewed.cv,
        recruiterAudit: initialAudit,
        ignoredSections: unique([
          ...baseState.ignoredSections.map((item) => JSON.stringify(item)),
          ...reviewed.ignoredSections.map((item) => JSON.stringify(item)),
        ]).map((item) => JSON.parse(item) as IgnoredSection),
        warnings: unique([...baseState.warnings, ...reviewed.warnings]),
        versions: [
          ...baseState.versions,
          addVersion({
            request,
            title: "Revision de estilo ATS friendly",
            scoreBefore,
            scoreAfter: auditAfter.compatibilityScore,
            notes: reviewed.ignoredSections.map((item) => item.reason),
          }),
        ],
      },
      stepSummary: "Revision de estilo ATS completada sin cambiar el template elegido.",
    });
  }

  const finalAudit = auditCv({ ...request, cv: currentCv });

  return reviewLoopResponseSchema.parse({
    state: {
      ...baseState,
      currentCv,
      recruiterAudit: initialAudit,
      finalAudit,
      versions: [
        ...baseState.versions,
        addVersion({
          request,
          title: "Reevaluacion final",
          scoreBefore,
          scoreAfter: finalAudit.compatibilityScore,
          notes: [...finalAudit.missingKeywords, ...finalAudit.redFlags],
        }),
      ],
    },
    stepSummary: "Reevaluacion final completada para decidir si conviene otra iteracion.",
  });
}

function buildPrompt(request: ReviewLoopRequest) {
  return `Eres un sistema experto en seleccion tecnica, ATS y mejora honesta de CVs.

Paso solicitado: ${request.stepId}

Reglas estrictas:
- No inventes experiencia, empresas, cargos, certificaciones, anos ni metricas.
- Si falta una metrica para la formula X/Y/Z, crea una alerta de evidencia faltante en warnings.
- Puedes reordenar, reescribir y enfocar bullets con keywords si hay respaldo real.
- No incluyas requisitos con nivel 0 como habilidad o experiencia.
- Conserva el template visual elegido en currentCv.template; no lo cambies salvo que el usuario lo pida.
- Si el paso es ats_style_review, revisa cabecera, longitud de resumen, longitud de bullets, keywords escaneables y compatibilidad ATS.
- Devuelve solo JSON compatible con este contrato:
{
  "state": {
    "currentCv": "AdaptedCV completo",
    "recruiterAudit": {
      "compatibilityScore": 1,
      "missingKeywords": ["max 5"],
      "redFlags": ["max 3"],
      "recruiterSummary": "string"
    },
    "finalAudit": "igual a recruiterAudit opcional",
    "ignoredSections": [{ "section": "summary|experience|skills|projects|education|general", "reason": "string", "rewrite": "string" }],
    "versions": [{ "id": "string", "createdAt": "ISO", "stepId": "${request.stepId}", "title": "string", "scoreBefore": 1, "scoreAfter": 1, "notes": ["string"] }],
    "warnings": ["string"]
  },
  "stepSummary": "string"
}

Datos:
${JSON.stringify(request, null, 2)}`;
}

export async function runReviewLoopStep(
  input: ReviewLoopRequest,
): Promise<ReviewLoopResponse> {
  const request = reviewLoopRequestSchema.parse(input);

  if (!process.env.OPENAI_API_KEY) {
    return demoRunReviewStep(request);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Actua como reclutador senior, ATS y gerente de contratacion. Mejora el CV sin inventar evidencia. Responde solo JSON valido.",
      },
      {
        role: "user",
        content: buildPrompt(request),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("OpenAI did not return review loop content.");
  }

  const parsed = reviewLoopResponseSchema.parse(JSON.parse(content));

  return reviewLoopResponseSchema.parse({
    ...parsed,
    state: {
      ...parsed.state,
      currentCv: adaptedCvSchema.parse(parsed.state.currentCv),
    },
  });
}
