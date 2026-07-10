import { type CVData } from "@/lib/cv/schema";
import { type JobAnalysis } from "@/lib/job/schema";
import { normalizeSearchText } from "@/lib/scoring/keyword-match";

const seniorityRank: Record<JobAnalysis["seniority"], number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  unknown: 2,
};

function inferCvSeniority(cv: CVData) {
  const text = normalizeSearchText(
    [cv.targetRole, cv.summary, ...cv.experience.map((item) => item.role)].join(" "),
  );

  if (text.includes("lead") || text.includes("principal") || text.includes("staff")) {
    return "lead" as const;
  }

  if (text.includes("senior") || cv.experience.length >= 4) {
    return "senior" as const;
  }

  if (text.includes("junior") || text.includes("trainee")) {
    return "junior" as const;
  }

  return cv.experience.length >= 2 ? ("mid" as const) : ("junior" as const);
}

export function calculateSeniorityRatio(cv: CVData, jobAnalysis: JobAnalysis) {
  if (jobAnalysis.seniority === "unknown") {
    return 0.7;
  }

  const cvRank = seniorityRank[inferCvSeniority(cv)];
  const jobRank = seniorityRank[jobAnalysis.seniority];
  const difference = Math.abs(cvRank - jobRank);

  if (difference === 0) {
    return 1;
  }

  if (difference === 1) {
    return 0.72;
  }

  return 0.35;
}
