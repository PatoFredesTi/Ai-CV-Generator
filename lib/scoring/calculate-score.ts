import { type CVData, cvDataSchema } from "@/lib/cv/schema";
import {
  type JobAnalysis,
  type JobRequirement,
  jobAnalysisSchema,
  jobRequirementsSchema,
} from "@/lib/job/schema";
import {
  type CVImprovement,
  type CVScoreReport,
  cvScoreReportSchema,
} from "@/lib/scoring/schema";
import { calculateImpactRatio } from "@/lib/scoring/impact-evidence";
import {
  cvToSearchText,
  normalizeSearchText,
  requirementWeight,
  weightedKeywordRatio,
} from "@/lib/scoring/keyword-match";
import { calculateSeniorityRatio } from "@/lib/scoring/seniority-match";

const levelRatio = {
  0: 0,
  1: 0.15,
  2: 0.35,
  3: 0.6,
  4: 0.8,
  5: 1,
} as const;

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function clampScore(value: number) {
  return Math.min(100, Math.max(1, Math.round(value)));
}

function calculateDeclaredLevelRatio(requirements: JobRequirement[]) {
  const totalWeight = requirements.reduce(
    (sum, requirement) => sum + requirementWeight(requirement),
    0,
  );

  if (totalWeight === 0) {
    return 0;
  }

  const scoredWeight = requirements.reduce(
    (sum, requirement) =>
      sum + requirementWeight(requirement) * levelRatio[requirement.userLevel],
    0,
  );

  return scoredWeight / totalWeight;
}

function calculateExperienceRatio(cv: CVData, requirements: JobRequirement[]) {
  const experienceText = normalizeSearchText(
    cv.experience
      .map((item) => `${item.role} ${item.company} ${item.bullets.join(" ")}`)
      .join(" "),
  );
  const evidenceText = normalizeSearchText(
    requirements.flatMap((requirement) => requirement.evidence ?? []).join(" "),
  );
  const text = `${experienceText} ${evidenceText}`;

  return weightedKeywordRatio(text, requirements);
}

function calculateAtsRatio(cv: CVData, jobAnalysis: JobAnalysis) {
  const sectionScore =
    Number(Boolean(cv.summary)) +
    Number(cv.experience.length > 0) +
    Number(cv.education.length > 0) +
    Number(cv.skills.length > 0);
  const keywordText = cvToSearchText(cv);
  const keywordMatches = jobAnalysis.keywords.filter((keyword) =>
    keywordText.includes(normalizeSearchText(keyword)),
  ).length;
  const keywordRatio =
    jobAnalysis.keywords.length > 0
      ? keywordMatches / Math.min(jobAnalysis.keywords.length, 8)
      : 0.65;

  return Math.min(sectionScore / 4 * 0.55 + keywordRatio * 0.45, 1);
}

function calculateConsistencyRatio(cv: CVData, requirements: JobRequirement[]) {
  const skillsText = normalizeSearchText(cv.skills.join(" "));
  const contradictions = requirements.filter(
    (requirement) =>
      requirement.userLevel === 0 &&
      skillsText.includes(normalizeSearchText(requirement.name)),
  );

  if (contradictions.length === 0) {
    return 1;
  }

  return Math.max(0.2, 1 - contradictions.length * 0.22);
}

function createVerdict(score: number) {
  if (score >= 82) {
    return "Alta compatibilidad. El perfil esta bien alineado y conviene reforzar evidencias medibles para destacar.";
  }

  if (score >= 65) {
    return "Compatibilidad media-alta. Hay base solida, pero algunas brechas o evidencias debiles pueden afectar la postulacion.";
  }

  if (score >= 45) {
    return "Compatibilidad media. El CV necesita priorizar mejor keywords, evidencias y alcance real antes de postular.";
  }

  return "Compatibilidad baja. La oferta pide varios requisitos que el perfil aun no respalda con suficiente evidencia.";
}

function buildRecommendations(params: {
  score: number;
  requirements: JobRequirement[];
  technicalRatio: number;
  declaredRatio: number;
  experienceRatio: number;
  impactRatio: number;
  consistencyRatio: number;
}) {
  const {
    requirements,
    technicalRatio,
    declaredRatio,
    experienceRatio,
    impactRatio,
    consistencyRatio,
  } = params;
  const improvements: CVImprovement[] = [];

  if (technicalRatio < 0.7) {
    improvements.push({
      priority: "high",
      section: "skills",
      issue: "Faltan keywords relevantes de la oferta en el CV.",
      suggestion:
        "Reordena las habilidades para mostrar primero las tecnologias requeridas que realmente manejas.",
    });
  }

  if (declaredRatio < 0.55) {
    improvements.push({
      priority: "high",
      section: "general",
      issue: "El nivel declarado queda bajo frente a los requisitos principales.",
      suggestion:
        "Marca brechas criticas y prepara proyectos pequenos para respaldar las tecnologias obligatorias.",
    });
  }

  if (experienceRatio < 0.55) {
    improvements.push({
      priority: "medium",
      section: "experience",
      issue: "La experiencia no evidencia suficientes requisitos de la oferta.",
      suggestion:
        "Agrega bullets con contexto real donde hayas usado las herramientas mas importantes.",
    });
  }

  if (impactRatio < 0.45) {
    improvements.push({
      priority: "medium",
      section: "experience",
      issue: "Faltan metricas o resultados verificables.",
      suggestion:
        "Incluye impacto medible: porcentajes, tiempos reducidos, automatizaciones o volumen de usuarios.",
    });
  }

  if (consistencyRatio < 1) {
    improvements.push({
      priority: "high",
      section: "skills",
      issue: "Hay habilidades marcadas como no manejadas que aparecen como skills.",
      suggestion:
        "Elimina del CV las tecnologias con nivel 0 y dejalas solo como brechas del reporte.",
    });
  }

  const lowRequired = requirements.filter(
    (requirement) =>
      requirement.importance === "required" && requirement.userLevel <= 2,
  );

  if (lowRequired.length > 0) {
    improvements.push({
      priority: "high",
      section: "projects",
      issue: "Existen requisitos obligatorios con bajo dominio declarado.",
      suggestion: `Crea evidencia practica para ${lowRequired
        .slice(0, 3)
        .map((item) => item.name)
        .join(", ")} antes de presentarlos como fortalezas.`,
    });
  }

  return improvements;
}

export function calculateCVScore(params: {
  cv: CVData;
  jobAnalysis: JobAnalysis;
  requirements: JobRequirement[];
}): CVScoreReport {
  const cv = cvDataSchema.parse(params.cv);
  const jobAnalysis = jobAnalysisSchema.parse(params.jobAnalysis);
  const requirements = jobRequirementsSchema.parse(params.requirements);
  const searchText = cvToSearchText(cv);

  const technicalRatio = weightedKeywordRatio(searchText, requirements);
  const declaredRatio = calculateDeclaredLevelRatio(requirements);
  const experienceRatio = calculateExperienceRatio(cv, requirements);
  const seniorityRatio = calculateSeniorityRatio(cv, jobAnalysis);
  const impactRatio = calculateImpactRatio(cv);
  const atsRatio = calculateAtsRatio(cv, jobAnalysis);
  const consistencyRatio = calculateConsistencyRatio(cv, requirements);

  const categoryScores = {
    technicalMatch: round(technicalRatio * 30),
    declaredLevelMatch: round(declaredRatio * 20),
    experienceMatch: round(experienceRatio * 20),
    seniorityMatch: round(seniorityRatio * 10),
    impactEvidence: round(impactRatio * 10),
    atsReadability: round(atsRatio * 5),
    consistency: round(consistencyRatio * 5),
  };

  const totalScore = clampScore(
    Object.values(categoryScores).reduce((sum, score) => sum + score, 0),
  );

  const strongRequirements = requirements
    .filter((requirement) => requirement.userLevel >= 4)
    .slice(0, 5);
  const gaps = requirements
    .filter((requirement) => requirement.userLevel === 0)
    .map((requirement) => `${requirement.name}: no declarado como manejado.`);
  const weaknesses = requirements
    .filter((requirement) => requirement.importance === "required" && requirement.userLevel <= 2)
    .map((requirement) => `${requirement.name}: requisito obligatorio con bajo respaldo.`);

  const strengths = [
    ...strongRequirements.map(
      (requirement) =>
        `${requirement.name}: nivel ${requirement.userLevel} declarado y util para la oferta.`,
    ),
  ];

  if (technicalRatio >= 0.7) {
    strengths.push("Buen match de keywords tecnicas entre el CV y la oferta.");
  }

  if (impactRatio >= 0.5) {
    strengths.push("La experiencia incluye senales de impacto medible.");
  }

  const improvements = buildRecommendations({
    score: totalScore,
    requirements,
    technicalRatio,
    declaredRatio,
    experienceRatio,
    impactRatio,
    consistencyRatio,
  });

  return cvScoreReportSchema.parse({
    totalScore,
    categoryScores,
    verdict: createVerdict(totalScore),
    strengths:
      strengths.length > 0
        ? strengths
        : ["El perfil tiene una base usable, pero necesita mas evidencia alineada."],
    weaknesses:
      weaknesses.length > 0
        ? weaknesses
        : ["No se detectan debilidades criticas, aunque conviene revisar evidencias."],
    gaps,
    improvements,
  });
}
