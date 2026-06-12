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

function capSkills(skills: string[]) {
  const merged = [...skills, ...defaultSkills];
  return Array.from(new Set(merged)).slice(0, 10);
}

function fallbackBullets(rawDescription: string, targetRole: string) {
  const fragments = cleanList(rawDescription).slice(0, 3);

  if (fragments.length > 0) {
    return fragments.map((fragment) =>
      fragment.length > 120 ? `${fragment.slice(0, 117)}...` : fragment,
    );
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
