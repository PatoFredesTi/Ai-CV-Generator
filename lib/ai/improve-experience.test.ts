import { describe, expect, it } from "vitest";
import {
  improveExperienceInputSchema,
  improveExperienceWriting,
  sanitizeImprovedExperience,
} from "@/lib/ai/improve-experience";
import { createFallbackGeneratedContent } from "@/lib/cv/transform";
import { type CVInput } from "@/lib/cv/schema";

describe("improveExperienceWriting", () => {
  it("improves short raw notes with demo fallback", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await improveExperienceWriting({
      rawDescription: "dashboard react, APIs, performance",
      role: "Frontend Developer",
      company: "NovaLabs",
      targetRole: "Frontend Developer",
      language: "es",
    });

    if (previousKey) {
      process.env.OPENAI_API_KEY = previousKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    expect(result.improvedDescription).toContain("dashboard react");
    expect(result.improvedDescription.length).toBeGreaterThan(40);
  });

  it("keeps already well-written bullets instead of prefixing another action verb", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await improveExperienceWriting({
      rawDescription:
        "- Desarrolle dashboards en React integrando APIs internas.\n- Mejore un 40% el flujo web migrando vistas criticas a Next.js SSG.",
      role: "Frontend Developer",
      company: "NovaLabs",
      targetRole: "Frontend Developer",
      language: "es",
      mode: "polish",
    });

    if (previousKey) {
      process.env.OPENAI_API_KEY = previousKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }

    expect(result.improvedDescription).toContain("Mejore un 40%");
    expect(result.improvedDescription).not.toMatch(/Desarrolle\s+Desarrolle/i);
  });

  it("removes unsupported numeric metrics from AI output", () => {
    const input = improveExperienceInputSchema.parse({
      rawDescription: "dashboard React, consumo de APIs, mejoras de performance",
      role: "Frontend Developer",
      company: "NovaLabs",
      targetRole: "Frontend Developer",
      language: "es",
      mode: "fast",
    });

    const result = sanitizeImprovedExperience(
      {
        bullets: [
          "Desarrolle Desarrolle dashboards en React reduciendo tiempos de carga en 40%.",
        ],
        warnings: [],
      },
      input,
      "openai",
      "test-model",
    );

    expect(result.improvedDescription).not.toMatch(/Desarrolle\s+Desarrolle/i);
    expect(result.improvedDescription).not.toContain("40%");
    expect(result.warnings[0]).toContain("metricas numericas");
  });

  it("does not double-prefix improved raw bullets in the CV fallback generator", () => {
    const input: CVInput = {
      personal: {
        fullName: "Patricio Herrera",
        email: "patricio@email.com",
        phone: "+56 9 1234 5678",
        location: "Santiago, Chile",
        linkedIn: "",
        github: "",
        website: "",
      },
      targetRole: "Frontend Developer",
      language: "es",
      tone: "technical",
      template: "modern",
      experience: [
        {
          company: "NovaLabs",
          role: "Frontend Developer",
          startDate: "2022",
          endDate: "Presente",
          rawDescription:
            "- Desarrolle dashboards en React integrando APIs internas.\n- Mejore un 40% el flujo web migrando vistas criticas a Next.js SSG.",
        },
      ],
      education: [
        {
          institution: "Instituto Demo",
          degree: "Ingenieria en Informatica",
          year: "2020",
        },
      ],
      rawSkills: "React, TypeScript, Next.js, APIs, SEO, testing",
    };

    const content = createFallbackGeneratedContent(input);

    expect(content.experience[0].bullets[0]).toContain("dashboards en React");
    expect(content.experience[0].bullets[0]).not.toMatch(/Desarrolle\s+Desarrolle/i);
    expect(content.experience[0].bullets[1]).toContain("40%");
  });
});
