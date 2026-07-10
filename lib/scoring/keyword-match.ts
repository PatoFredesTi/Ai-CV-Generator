import { type CVData } from "@/lib/cv/schema";
import { type JobRequirement } from "@/lib/job/schema";

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cvToSearchText(cv: CVData) {
  return normalizeSearchText(
    [
      cv.targetRole,
      cv.summary,
      cv.skills.join(" "),
      cv.education.map((item) => `${item.degree} ${item.institution}`).join(" "),
      cv.experience
        .map((item) => `${item.role} ${item.company} ${item.bullets.join(" ")}`)
        .join(" "),
    ].join(" "),
  );
}

export function requirementWeight(requirement: Pick<JobRequirement, "importance">) {
  return requirement.importance === "required" ? 1 : 0.6;
}

export function weightedKeywordRatio(
  searchText: string,
  requirements: JobRequirement[],
) {
  const totalWeight = requirements.reduce(
    (sum, requirement) => sum + requirementWeight(requirement),
    0,
  );

  if (totalWeight === 0) {
    return 0;
  }

  const matchedWeight = requirements.reduce((sum, requirement) => {
    const name = normalizeSearchText(requirement.name);
    return searchText.includes(name) ? sum + requirementWeight(requirement) : sum;
  }, 0);

  return matchedWeight / totalWeight;
}
