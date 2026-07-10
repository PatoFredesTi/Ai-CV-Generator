"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { AdaptedCvPreview } from "@/components/cv/AdaptedCvPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adaptedCvSchema,
  type AdaptedCV,
  type ExtraSection,
} from "@/lib/cv/adapted-schema";
import {
  ADAPTED_CV_KEY,
  readAdaptedCv,
  writeJson,
} from "@/lib/workflow/storage";

function lines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitParts(line: string) {
  return line.split("|").map((part) => part.trim());
}

function projectsFromText(value: string): AdaptedCV["projects"] {
  return lines(value).map((line) => {
    const [name, description = "", technologies = "", bullet = ""] = splitParts(line);

    return {
      name,
      description: description || undefined,
      technologies: technologies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      bullets: bullet ? [bullet] : [],
    };
  });
}

function projectsToText(cv: AdaptedCV) {
  return cv.projects
    .map((project) =>
      [
        project.name,
        project.description ?? "",
        project.technologies.join(", "),
        project.bullets[0] ?? "",
      ].join(" | "),
    )
    .join("\n");
}

function languagesFromText(value: string): AdaptedCV["languages"] {
  return lines(value).map((line) => {
    const [name, level = "No especificado"] = splitParts(line);
    return { name, level: level || "No especificado" };
  });
}

function languagesToText(cv: AdaptedCV) {
  return cv.languages.map((item) => `${item.name} | ${item.level}`).join("\n");
}

function certificationsFromText(value: string): AdaptedCV["certifications"] {
  return lines(value).map((line) => {
    const [name, issuer = "", year = ""] = splitParts(line);
    return { name, issuer, year };
  });
}

function certificationsToText(cv: AdaptedCV) {
  return cv.certifications
    .map((item) => [item.name, item.issuer ?? "", item.year ?? ""].join(" | "))
    .join("\n");
}

function createExtraSection(index: number): ExtraSection {
  return {
    id: `extra-${Date.now()}-${index}`,
    title: "Voluntariado",
    items: [],
  };
}

export function CvExtrasEditor() {
  const [cv, setCv] = useState<AdaptedCV | null>(null);
  const [projects, setProjects] = useState("");
  const [languages, setLanguages] = useState("");
  const [certifications, setCertifications] = useState("");
  const [extraSections, setExtraSections] = useState<ExtraSection[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = readAdaptedCv();
    if (!stored) {
      return;
    }

    setCv(stored);
    setProjects(projectsToText(stored));
    setLanguages(languagesToText(stored));
    setCertifications(certificationsToText(stored));
    setExtraSections(stored.extraSections);
  }, []);

  const previewCv = cv
    ? adaptedCvSchema.parse({
        ...cv,
        projects: projectsFromText(projects),
        languages: languagesFromText(languages),
        certifications: certificationsFromText(certifications),
        extraSections: extraSections.filter(
          (section) => section.title.trim() && section.items.length > 0,
        ),
      })
    : null;

  const save = () => {
    if (!cv || !previewCv) {
      setMessage("No hay CV adaptado para guardar extras.");
      return;
    }

    writeJson(ADAPTED_CV_KEY, previewCv);
    setCv(previewCv);
    setMessage("Extras guardados. Puedes volver al ciclo de mejora.");
  };

  if (!cv) {
    return (
      <div className="rounded-md border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          No hay CV adaptado
        </h1>
        <Button asChild className="mt-5">
          <Link href="/adapted-cv">Ir a CV adaptado</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
      <section className="space-y-4 rounded-md border bg-white p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
        <div>
          <p className="text-sm font-medium text-primary">Extras</p>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
            Potenciar CV
          </h1>
        </div>

        <Field
          label="Proyectos"
          help="Formato: Nombre | Descripcion | React, AWS | Resultado o logro"
        >
          <Textarea
            className="min-h-28"
            value={projects}
            onChange={(event) => setProjects(event.target.value)}
            placeholder="Portfolio personal | Sitio SSG con Next.js | Next.js, SEO | Mejore indexacion y performance"
          />
        </Field>

        <Field label="Idiomas" help="Formato: Idioma | Nivel">
          <Textarea
            className="min-h-20"
            value={languages}
            onChange={(event) => setLanguages(event.target.value)}
            placeholder="Ingles | B2"
          />
        </Field>

        <Field label="Certificaciones / cursos" help="Formato: Nombre | Institucion | Ano">
          <Textarea
            className="min-h-20"
            value={certifications}
            onChange={(event) => setCertifications(event.target.value)}
            placeholder="AWS Cloud Practitioner | AWS | 2026"
          />
        </Field>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-900">Otras secciones</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setExtraSections((current) => [
                  ...current,
                  createExtraSection(current.length + 1),
                ])
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </Button>
          </div>

          {extraSections.map((section) => (
            <div key={section.id} className="rounded-md border bg-slate-50 p-3">
              <div className="mb-2 flex gap-2">
                <Input
                  value={section.title}
                  onChange={(event) =>
                    setExtraSections((current) =>
                      current.map((item) =>
                        item.id === section.id
                          ? { ...item, title: event.target.value }
                          : item,
                      ),
                    )
                  }
                  placeholder="Referencias, Voluntariado, Ayudantias..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Eliminar seccion"
                  title="Eliminar seccion"
                  onClick={() =>
                    setExtraSections((current) =>
                      current.filter((item) => item.id !== section.id),
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <Textarea
                className="min-h-20"
                value={section.items.join("\n")}
                onChange={(event) =>
                  setExtraSections((current) =>
                    current.map((item) =>
                      item.id === section.id
                        ? { ...item, items: lines(event.target.value) }
                        : item,
                    ),
                  )
                }
                placeholder="Mentor de estudiantes frontend en bootcamp..."
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={save}>
            <Save className="size-4" aria-hidden="true" />
            Guardar extras
          </Button>
          <Button asChild variant="outline">
            <Link href="/review-loop">
              Volver al ciclo
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {message ? (
          <p className="rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </section>

      {previewCv ? <AdaptedCvPreview cv={previewCv} /> : null}
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs leading-5 text-muted-foreground">{help}</p>
      </div>
      {children}
    </div>
  );
}
