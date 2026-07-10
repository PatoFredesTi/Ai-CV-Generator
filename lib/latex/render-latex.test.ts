import { describe, expect, it } from "vitest";
import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { renderLatex } from "@/lib/latex/render-latex";

const adaptedCv: AdaptedCV = {
  personalInfo: {
    fullName: "Patricio Herrera",
    email: "patricio@email.com",
    phone: "+56 9 1234 5678",
    location: "Santiago, Chile",
    linkedIn: "linkedin.com/in/patricio",
    website: "patricio.dev",
  },
  targetRole: "Frontend Developer",
  summary:
    "Frontend Developer con experiencia en React, TypeScript y construccion de productos web.",
  experience: [
    {
      company: "NovaLabs",
      role: "Frontend Developer",
      startDate: "2023",
      endDate: "Presente",
      bullets: ["Construyo interfaces con React y TypeScript."],
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

describe("renderLatex", () => {
  it("generates a latex document with main sections", () => {
    const output = renderLatex({ cv: adaptedCv, templateId: "ats-modern" });

    expect(output.latexSource).toContain("\\documentclass");
    expect(output.latexSource).toContain("Patricio Herrera");
    expect(output.latexSource).toContain("Resumen Profesional");
    expect(output.latexSource).not.toContain("{{");
  });
});
