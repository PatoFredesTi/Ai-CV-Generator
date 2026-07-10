import {
  type JobAnalysis,
  type JobRequirement,
  type RequirementCategory,
  jobAnalysisSchema,
  jobRequirementsSchema,
} from "@/lib/job/schema";

const categoryKeywords: Array<{
  category: RequirementCategory;
  patterns: string[];
}> = [
  {
    category: "language",
    patterns: [
      "javascript",
      "typescript",
      "python",
      "java",
      "c#",
      "php",
      "ruby",
      "go",
      "golang",
      "rust",
      "sql",
    ],
  },
  {
    category: "framework",
    patterns: [
      "react",
      "next",
      "next.js",
      "vue",
      "angular",
      "svelte",
      "express",
      "nestjs",
      "spring",
      "django",
      "laravel",
      "tailwind",
    ],
  },
  {
    category: "database",
    patterns: [
      "postgres",
      "postgresql",
      "mysql",
      "mongodb",
      "redis",
      "sql server",
      "oracle",
      "dynamodb",
      "firebase",
    ],
  },
  {
    category: "cloud",
    patterns: ["aws", "azure", "gcp", "google cloud", "lambda", "s3", "cloud"],
  },
  {
    category: "devops",
    patterns: [
      "docker",
      "kubernetes",
      "ci/cd",
      "github actions",
      "gitlab",
      "terraform",
      "jenkins",
      "devops",
    ],
  },
  {
    category: "methodology",
    patterns: ["scrum", "agile", "kanban", "lean"],
  },
  {
    category: "architecture",
    patterns: ["microservices", "microservicios", "clean architecture", "hexagonal"],
  },
];

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createId(name: string, suffix: number) {
  const slug = normalizeName(name).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slug || "requirement"}-${suffix}`;
}

export function inferRequirementCategory(name: string): RequirementCategory {
  const normalized = normalizeName(name);
  const match = categoryKeywords.find((item) =>
    item.patterns.some((pattern) => normalized.includes(normalizeName(pattern))),
  );

  return match?.category ?? "tool";
}

function addRequirement(
  map: Map<string, JobRequirement>,
  name: string,
  importance: JobRequirement["importance"],
  category?: RequirementCategory,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }

  const key = normalizeName(trimmed);
  if (map.has(key)) {
    const current = map.get(key);
    if (current && current.importance === "nice_to_have" && importance === "required") {
      map.set(key, { ...current, importance: "required" });
    }
    return;
  }

  map.set(key, {
    id: createId(trimmed, map.size + 1),
    name: trimmed,
    category: category ?? inferRequirementCategory(trimmed),
    importance,
    detectedFromOffer: true,
    userLevel: 0,
    evidence: [],
  });
}

export function createRequirementsFromAnalysis(analysis: JobAnalysis): JobRequirement[] {
  const parsed = jobAnalysisSchema.parse(analysis);
  const requirements = new Map<string, JobRequirement>();

  parsed.requiredSkills.forEach((skill) =>
    addRequirement(requirements, skill, "required"),
  );
  parsed.niceToHaveSkills.forEach((skill) =>
    addRequirement(requirements, skill, "nice_to_have"),
  );
  parsed.detectedStack.forEach((skill) =>
    addRequirement(requirements, skill, "nice_to_have"),
  );
  parsed.softSkills.forEach((skill) =>
    addRequirement(requirements, skill, "nice_to_have", "soft_skill"),
  );

  return jobRequirementsSchema.parse(Array.from(requirements.values()));
}
