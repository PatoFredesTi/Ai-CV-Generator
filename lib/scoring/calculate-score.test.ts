import { describe, expect, it } from "vitest";
import { demoCv } from "@/lib/cv/demo";
import { calculateCVScore } from "@/lib/scoring/calculate-score";
import { type JobAnalysis, type JobRequirement } from "@/lib/job/schema";

const jobAnalysis: JobAnalysis = {
  roleTitle: "Frontend Developer",
  seniority: "mid",
  requiredSkills: ["React", "TypeScript"],
  niceToHaveSkills: ["Docker"],
  responsibilities: [],
  keywords: ["React", "TypeScript", "performance"],
  detectedStack: ["React", "TypeScript", "Next.js"],
  softSkills: [],
};

function requirements(level: JobRequirement["userLevel"]): JobRequirement[] {
  return [
    {
      id: "react",
      name: "React",
      category: "framework",
      importance: "required",
      detectedFromOffer: true,
      userLevel: level,
      evidence: [],
    },
    {
      id: "docker",
      name: "Docker",
      category: "devops",
      importance: "nice_to_have",
      detectedFromOffer: true,
      userLevel: level,
      evidence: [],
    },
  ];
}

describe("calculateCVScore", () => {
  it("keeps the score between 1 and 100", () => {
    const report = calculateCVScore({
      cv: demoCv,
      jobAnalysis,
      requirements: requirements(3),
    });

    expect(report.totalScore).toBeGreaterThanOrEqual(1);
    expect(report.totalScore).toBeLessThanOrEqual(100);
  });

  it("scores level 5 higher than level 1", () => {
    const high = calculateCVScore({
      cv: demoCv,
      jobAnalysis,
      requirements: requirements(5),
    });
    const low = calculateCVScore({
      cv: demoCv,
      jobAnalysis,
      requirements: requirements(1),
    });

    expect(high.totalScore).toBeGreaterThan(low.totalScore);
  });

  it("marks level 0 requirements as gaps", () => {
    const report = calculateCVScore({
      cv: demoCv,
      jobAnalysis,
      requirements: requirements(0),
    });

    expect(report.gaps.length).toBeGreaterThan(0);
  });
});
