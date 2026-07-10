import {
  type CVData,
  type CVInput,
  type GeneratedContent,
  cvDataSchema,
} from "./schema";

const defaultSkills = [
  "Comunicación",
  "Resolución de problemas",
  "Trabajo colaborativo",
  "Pensamiento analítico",
  "Gestión del tiempo",
  "Mejora continua",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `cv-${Date.now()}`;
}

function cleanList(value: string) {
  return value
    .split(/[,;\n]/)
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

function cleanExperienceFragments(value: string) {
  const lineFragments = value
    .split(/[\n;]/)
    .map((item) => stripBulletMarker(item))
    .filter(Boolean);

  if (lineFragments.length > 1 || /^\s*[-*]/m.test(value)) {
    return lineFragments;
  }

  return cleanList(value).map((item) => stripBulletMarker(item));
}

function capSkills(skills: string[]) {
  const merged = [...skills, ...defaultSkills];
  return Array.from(new Set(merged)).slice(0, 10);
}

function fallbackBullets(rawDescription: string, targetRole: string) {
  const fragments = cleanExperienceFragments(rawDescription).slice(0, 3);

  if (fragments.length > 0) {
    return fragments.map((fragment, index) => {
      const cleaned =
        fragment.length > 140 && !looksLikeCompleteBullet(fragment)
          ? `${fragment.slice(0, 137)}...`
          : fragment;

      if (looksLikeCompleteBullet(cleaned)) {
        return ensureSentence(cleaned);
      }

      if (index === 0) {
        return `Desarrolle ${cleaned}, alineando la ejecucion con objetivos del rol de ${targetRole}.`;
      }

      if (index === 1) {
        return `Colabore con equipos internos para ejecutar ${cleaned}, manteniendo foco en calidad y entrega.`;
      }

      return `Optimice y documente avances relacionados con ${cleaned}, apoyando la mejora continua del equipo.`;
    });
  }

  return [
    `Ejecuté iniciativas clave alineadas al rol de ${targetRole}.`,
    "Colaboré con equipos multidisciplinarios para mejorar resultados operativos.",
    "Documenté avances y aprendizajes para acelerar la entrega de valor.",
  ];
}

export function createFallbackGeneratedContent(input: CVInput): GeneratedContent {
  const skills = capSkills(cleanList(input.rawSkills));
  const summary =
    input.language === "en"
      ? `${input.personal.fullName} is a ${input.targetRole} focused on measurable delivery, cross-functional collaboration, and continuous improvement. Brings practical experience translating business needs into clear, reliable outcomes.`
      : `${input.personal.fullName} es un perfil ${input.targetRole} orientado a resultados medibles, colaboración transversal y mejora continua. Aporta experiencia práctica convirtiendo necesidades del negocio en entregables claros y confiables.`;

  return {
    summary,
    experience: input.experience.map((item) => ({
      company: item.company,
      role: item.role,
      startDate: item.startDate,
      endDate: item.endDate,
      bullets: fallbackBullets(item.rawDescription, input.targetRole),
    })),
    skills,
  };
}

export function buildCvFromInput(
  input: CVInput,
  generated: GeneratedContent,
  options: Partial<Pick<CVData, "id" | "createdAt">> = {},
): CVData {
  const data: CVData = {
    id: options.id ?? createId(),
    createdAt: options.createdAt ?? new Date().toISOString(),
    personal: input.personal,
    targetRole: input.targetRole,
    language: input.language,
    tone: input.tone,
    template: input.template,
    summary: generated.summary,
    experience: input.experience.map((item, index) => {
      const aiItem = generated.experience[index];

      return {
        company: item.company,
        role: item.role,
        startDate: item.startDate,
        endDate: item.endDate,
        bullets: aiItem?.bullets?.length
          ? aiItem.bullets
          : fallbackBullets(item.rawDescription, input.targetRole),
      };
    }),
    education: input.education,
    skills: capSkills(generated.skills),
    rawInput: input,
  };

  return cvDataSchema.parse(data);
}
