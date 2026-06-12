import { type CVInput } from "./schema";
import { buildCvFromInput, createFallbackGeneratedContent } from "./transform";

export const demoInput: CVInput = {
  personal: {
    fullName: "Patricio Herrera",
    email: "patricio@email.com",
    phone: "+56 9 1234 5678",
    location: "Santiago, Chile",
    linkedIn: "linkedin.com/in/patricioherrera",
    website: "patricio.dev",
  },
  targetRole: "Frontend Developer",
  language: "es",
  tone: "technical",
  template: "modern",
  experience: [
    {
      company: "NovaLabs",
      role: "Frontend Developer",
      startDate: "2023",
      endDate: "Presente",
      rawDescription:
        "Construí dashboards en React y Next.js, reduje tiempos de carga, integré APIs internas, trabajé con diseño y producto, mejoré cobertura de tests.",
    },
    {
      company: "Andes Digital",
      role: "Web Developer",
      startDate: "2021",
      endDate: "2023",
      rawDescription:
        "Desarrollé componentes reutilizables, automaticé flujos de contenido, mantuve sitios responsivos y colaboré en entregas para clientes SaaS.",
    },
  ],
  education: [
    {
      institution: "Instituto Profesional Duoc UC",
      degree: "Ingeniería en Informática",
      year: "2021",
    },
  ],
  rawSkills:
    "React, TypeScript, Next.js, Tailwind CSS, Testing Library, UX, Git, APIs REST",
};

export const demoCv = buildCvFromInput(
  demoInput,
  createFallbackGeneratedContent(demoInput),
  {
    id: "demo",
    createdAt: "2026-04-01T00:00:00.000Z",
  },
);
