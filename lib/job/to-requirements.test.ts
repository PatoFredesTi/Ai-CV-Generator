import { describe, expect, it } from "vitest";
import { createRequirementsFromAnalysis } from "@/lib/job/to-requirements";
import { type JobAnalysis } from "@/lib/job/schema";

const analysis: JobAnalysis = {
  roleTitle: "Frontend Developer",
  seniority: "mid",
  requiredSkills: ["React", "TypeScript"],
  niceToHaveSkills: ["Docker", "React"],
  responsibilities: [],
  keywords: [],
  detectedStack: ["Next.js", "TypeScript"],
  softSkills: ["Comunicacion"],
};

describe("createRequirementsFromAnalysis", () => {
  it("converts required and nice-to-have skills", () => {
    const requirements = createRequirementsFromAnalysis(analysis);

    expect(requirements.find((item) => item.name === "React")?.importance).toBe(
      "required",
    );
    expect(requirements.find((item) => item.name === "Docker")?.importance).toBe(
      "nice_to_have",
    );
  });

  it("avoids duplicates and defaults user level to 0", () => {
    const requirements = createRequirementsFromAnalysis(analysis);
    const names = requirements.map((item) => item.name);

    expect(names.filter((name) => name === "React")).toHaveLength(1);
    expect(requirements.every((item) => item.userLevel === 0)).toBe(true);
  });
});
