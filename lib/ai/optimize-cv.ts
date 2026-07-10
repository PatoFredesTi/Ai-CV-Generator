import OpenAI from "openai";
import {
  adaptedCvSchema,
  type AdaptedCV,
  type SkillGroup,
} from "@/lib/cv/adapted-schema";
import { type CVData, cvDataSchema } from "@/lib/cv/schema";
import {
  type JobAnalysis,
  type JobRequirement,
  jobAnalysisSchema,
  jobRequirementsSchema,
} from "@/lib/job/schema";
import {
  type CVScoreReport,
  cvScoreReportSchema,
} from "@/lib/scoring/schema";
import { normalizeSearchText } from "@/lib/scoring/keyword-match";

function unique(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function buildSkillGroups(cv: CVData, requirements: JobRequirement[]): SkillGroup[] {
  const blocked = requirements
    .filter((requirement) => requirement.userLevel === 0)
    .map((requirement) => normalizeSearchText(requirement.name));
  const allowedCvSkills = cv.skills.filter(
    (skill) =>
      !blocked.some((blockedSkill) =>
        normalizeSearchText(skill).includes(blockedSkill),
      ),
  );
  const strongRequirements = requirements
    .filter((requirement) => requirement.userLevel >= 4)
    .sort((a, b) => b.userLevel - a.userLevel)
    .map((requirement) => requirement.name);
  const practicalRequirements = requirements
    .filter((requirement) => requirement.userLevel > 0 && requirement.userLevel < 4)
    .map((requirement) => requirement.name);

  return [
    {
      name: "Prioritarias para la oferta",
      items: unique([...strongRequirements, ...allowedCvSkills]).slice(0, 10),
    },
    {
      name: "Conocimientos complementarios",
      items: unique([...practicalRequirements, ...allowedCvSkills]).slice(0, 10),
    },
  ].filter((group) => group.items.length > 0);
}

function buildWarnings(jobAnalysis: JobAnalysis, requirements: JobRequirement[]) {
  const zeroLevel = requirements.filter((requirement) => requirement.userLevel === 0);
  const lowRequired = requirements.filter(
    (requirement) =>
      requirement.importance === "required" && requirement.userLevel > 0 && requirement.userLevel <= 2,
  );

  return [
    ...zeroLevel.map(
      (requirement) =>
        `${requirement.name} aparece en la oferta, pero fue marcado como no manejado. No se incluye como habilidad del CV.`,
    ),
    ...lowRequired.map(
      (requirement) =>
        `${requirement.name} es obligatorio y tiene nivel bajo declarado; se debe presentar con cautela y evidencia real.`,
    ),
    jobAnalysis.seniority === "senior"
      ? "La oferta solicita seniority senior; evita afirmar liderazgo o alcance si no esta respaldado en la experiencia."
      : "",
  ].filter(Boolean);
}

function supportedRequirementNames(cv: CVData, requirements: JobRequirement[]) {
  const cvSkills = cv.skills.map((skill) => normalizeSearchText(skill));

  return requirements
    .filter((requirement) => requirement.userLevel >= 3)
    .filter((requirement) => {
      const name = normalizeSearchText(requirement.name);
      return (
        cvSkills.some((skill) => skill.includes(name) || name.includes(skill)) ||
        (requirement.evidence?.length ?? 0) > 0
      );
    })
    .map((requirement) => requirement.name)
    .slice(0, 4);
}

function adaptBulletForJob(bullet: string, supportedNames: string[]) {
  const cleaned = bullet.trim();

  if (supportedNames.length === 0) {
    return cleaned;
  }

  const normalized = normalizeSearchText(cleaned);
  const alreadyMentionsRequirement = supportedNames.some((name) =>
    normalized.includes(normalizeSearchText(name)),
  );

  if (alreadyMentionsRequirement) {
    return cleaned;
  }

  const focus = supportedNames.slice(0, 2).join(" y ");

  if (cleaned.length < 90) {
    return `${cleaned}, conectando la experiencia con ${focus} segun los requisitos de la oferta.`;
  }

  return `${cleaned} En la version adaptada se prioriza su relacion con ${focus}.`;
}

function createDemoAdaptedCv(params: {
  cv: CVData;
  jobAnalysis: JobAnalysis;
  requirements: JobRequirement[];
}): AdaptedCV {
  const { cv, jobAnalysis, requirements } = params;
  const relevantSkills = requirements
    .filter((requirement) => requirement.userLevel >= 3)
    .map((requirement) => requirement.name)
    .slice(0, 4);
  const roleLabel =
    jobAnalysis.roleTitle && jobAnalysis.roleTitle !== "unknown"
      ? jobAnalysis.roleTitle
      : cv.targetRole;
  const summarySuffix =
    relevantSkills.length > 0
      ? ` Enfoca su experiencia en ${relevantSkills.join(", ")} con evidencia real declarada por el usuario.`
      : " Mantiene una postulacion honesta, priorizando experiencia y habilidades respaldadas.";
  const supportedNames = supportedRequirementNames(cv, requirements);

  return adaptedCvSchema.parse({
    personalInfo: cv.personal,
    template: cv.template,
    targetRole: roleLabel,
    summary: `${cv.summary} Perfil adaptado para ${roleLabel}.${summarySuffix}`,
    experience: cv.experience.map((item) => ({
      ...item,
      bullets: item.bullets
        .map((bullet) => bullet.trim())
        .filter(Boolean)
        .map((bullet) => adaptBulletForJob(bullet, supportedNames))
        .slice(0, 4),
    })),
    skills: buildSkillGroups(cv, requirements),
    projects: [],
    education: cv.education,
    certifications: [],
    languages: [],
    warnings: buildWarnings(jobAnalysis, requirements),
  });
}

function enforceHonestyRules(params: {
  originalCv: CVData;
  adapted: AdaptedCV;
  jobAnalysis: JobAnalysis;
  requirements: JobRequirement[];
}) {
  const { originalCv, adapted, jobAnalysis, requirements } = params;
  const blocked = requirements
    .filter((requirement) => requirement.userLevel === 0)
    .map((requirement) => normalizeSearchText(requirement.name));
  const filteredSkillGroups = adapted.skills
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (skill) =>
          !blocked.some((blockedSkill) =>
            normalizeSearchText(skill).includes(blockedSkill),
          ),
      ),
    }))
    .filter((group) => group.items.length > 0);

  return adaptedCvSchema.parse({
    ...adapted,
    personalInfo: originalCv.personal,
    template: originalCv.template,
    targetRole: adapted.targetRole || jobAnalysis.roleTitle || originalCv.targetRole,
    experience: originalCv.experience.map((item, index) => ({
      ...item,
      bullets: adapted.experience[index]?.bullets?.length
        ? adapted.experience[index].bullets.slice(0, 4)
        : item.bullets,
    })),
    education: originalCv.education,
    skills: filteredSkillGroups.length > 0
      ? filteredSkillGroups
      : buildSkillGroups(originalCv, requirements),
    warnings: unique([...adapted.warnings, ...buildWarnings(jobAnalysis, requirements)]),
  });
}

function buildPrompt(params: {
  cv: CVData;
  jobAnalysis: JobAnalysis;
  requirements: JobRequirement[];
  scoreReport: CVScoreReport;
}) {
  return `Actua como experto en CVs tecnicos, ATS y reclutamiento TI.

Debes adaptar el CV del usuario a una oferta laboral especifica.

Reglas estrictas:
- No inventes experiencia.
- No inventes empresas.
- No inventes cargos.
- No inventes anos de experiencia.
- No inventes certificaciones.
- No presentes una tecnologia como fortaleza si el usuario declaro bajo dominio.
- No incluyas tecnologias con nivel 0 como habilidades.
- Si una tecnologia es requerida pero el usuario no la maneja, marcala como brecha en warnings.
- Puedes mejorar redaccion, orden, claridad, impacto y keywords.
- Debes mejorar los bullets de experiencia para alinearlos con la oferta cuando exista respaldo real.
- Usa requisitos con nivel 4 o 5 como fortalezas principales.
- Usa requisitos con nivel 3 de forma moderada y solo si hay evidencia.
- Usa requisitos con nivel 1 o 2 solo como conocimiento inicial o secundario.
- Nunca incluyas requisitos con nivel 0 en skills ni como experiencia.
- Si un requisito aparece en evidencia del usuario, puedes conectarlo al bullet; si no aparece, no lo inventes.
- Debes mantener una postulacion honesta y estrategica.

Devuelve solo JSON valido con esta forma:
{
  "personalInfo": { "fullName": "...", "email": "...", "phone": "...", "location": "...", "linkedIn": "", "github": "", "website": "" },
  "template": "${params.cv.template}",
  "targetRole": "string",
  "summary": "string",
  "experience": [{ "company": "igual al original", "role": "igual al original", "startDate": "igual al original", "endDate": "igual al original", "bullets": ["max 4"] }],
  "skills": [{ "name": "categoria", "items": ["skill"] }],
  "projects": [],
  "education": [],
  "certifications": [],
  "languages": [],
  "warnings": ["string"]
}

Datos:
${JSON.stringify(params, null, 2)}`;
}

export async function optimizeCVForJob(params: {
  cv: CVData;
  jobAnalysis: JobAnalysis;
  requirements: JobRequirement[];
  scoreReport: CVScoreReport;
}): Promise<AdaptedCV> {
  const cv = cvDataSchema.parse(params.cv);
  const jobAnalysis = jobAnalysisSchema.parse(params.jobAnalysis);
  const requirements = jobRequirementsSchema.parse(params.requirements);
  const scoreReport = cvScoreReportSchema.parse(params.scoreReport);

  if (!process.env.OPENAI_API_KEY) {
    return createDemoAdaptedCv({ cv, jobAnalysis, requirements });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Eres un experto en CVs ATS. Responde solo con JSON valido y respeta estrictamente los datos originales.",
      },
      {
        role: "user",
        content: buildPrompt({ cv, jobAnalysis, requirements, scoreReport }),
      },
    ],
  });

  const content = completion.choices[0]?.message.content;

  if (!content) {
    throw new Error("OpenAI did not return optimized CV content.");
  }

  const adapted = adaptedCvSchema.parse(JSON.parse(content));

  return enforceHonestyRules({
    originalCv: cv,
    adapted,
    jobAnalysis,
    requirements,
  });
}
