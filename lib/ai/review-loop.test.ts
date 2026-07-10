import { describe, expect, it } from "vitest";
import { runReviewLoopStep } from "@/lib/ai/review-loop";
import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { type JobAnalysis, type JobRequirement } from "@/lib/job/schema";

const cv: AdaptedCV = {
  personalInfo: {
    fullName: "Patricio Herrera",
    email: "patricio@email.com",
    phone: "+56 9 1234 5678",
    location: "Santiago, Chile",
    linkedIn: "linkedin.com/in/patricio",
    github: "github.com/patricio",
    website: "patricio.dev",
  },
  targetRole: "Frontend Developer",
  summary:
    "Frontend Developer con experiencia en productos web, React, TypeScript y colaboracion con equipos de producto.",
  experience: [
    {
      company: "NovaLabs",
      role: "Frontend Developer",
      startDate: "2023",
      endDate: "Presente",
      bullets: ["Reduje tiempos de carga en 25% optimizando componentes React."],
    },
  ],
  skills: [
    {
      name: "Frontend",
      items: ["React", "TypeScript"],
    },
  ],
  projects: [],
  education: [
    {
      institution: "Duoc UC",
      degree: "Ingenieria en Informatica",
      year: "2021",
    },
  ],
  certifications: [],
  languages: [],
  warnings: [],
};

const jobAnalysis: JobAnalysis = {
  roleTitle: "Frontend Developer",
  seniority: "mid",
  requiredSkills: ["React", "TypeScript", "Next.js"],
  niceToHaveSkills: ["Testing Library"],
  responsibilities: [],
  keywords: ["React", "TypeScript", "Next.js", "performance"],
  detectedStack: ["React", "TypeScript", "Next.js"],
  softSkills: [],
};

const requirements: JobRequirement[] = [
  {
    id: "react",
    name: "React",
    category: "framework",
    importance: "required",
    detectedFromOffer: true,
    userLevel: 5,
    evidence: ["Componentes React"],
  },
  {
    id: "next",
    name: "Next.js",
    category: "framework",
    importance: "required",
    detectedFromOffer: true,
    userLevel: 3,
    evidence: [],
  },
];

describe("runReviewLoopStep", () => {
  it("runs recruiter audit and XYZ rewrite with demo fallback", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const audit = await runReviewLoopStep({
      stepId: "senior_recruiter_audit",
      cv,
      jobAnalysis,
      requirements,
    });
    const rewritten = await runReviewLoopStep({
      stepId: "xyz_experience_rewrite",
      cv,
      jobAnalysis,
      requirements,
      previousState: audit.state,
    });

    if (previousKey) {
      process.env.OPENAI_API_KEY = previousKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    expect(audit.state.recruiterAudit?.compatibilityScore).toBeGreaterThan(0);
    expect(rewritten.state.currentCv.experience[0].bullets[0]).toContain("Logre");
    expect(rewritten.state.currentCv.experience[0].bullets[0]).not.toMatch(
      /Logre\s+(Desarrolle|Logre)/i,
    );
    expect(rewritten.state.versions.length).toBe(2);
  });
});
