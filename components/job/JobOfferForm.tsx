"use client";

import { useState, useTransition } from "react";
import { ArrowRight, BriefcaseBusiness, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRequirementsFromAnalysis } from "@/lib/job/to-requirements";
import { type JobAnalysis, type TargetLanguage } from "@/lib/job/schema";
import {
  JOB_ANALYSIS_KEY,
  REQUIREMENTS_KEY,
  writeJson,
} from "@/lib/workflow/storage";

const demoOffer = `Buscamos Frontend Developer con experiencia en React, TypeScript y Next.js para construir dashboards SaaS. La persona trabajara con APIs REST, Tailwind CSS, testing y buenas practicas de performance. Valoramos experiencia con Docker, AWS y Testing Library. Modalidad remota, contrato full-time, equipo agil y colaborativo.`;

export function JobOfferForm() {
  const [rawText, setRawText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("es");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const analyze = () => {
    setMessage(null);
    setAnalysis(null);

    startTransition(async () => {
      const response = await fetch("/api/analyze-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText, targetLanguage }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.message ?? "No se pudo analizar la oferta.");
        return;
      }

      const requirements = createRequirementsFromAnalysis(payload);
      writeJson(JOB_ANALYSIS_KEY, payload);
      writeJson(REQUIREMENTS_KEY, requirements);
      setAnalysis(payload);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
      <section className="rounded-md border bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Oferta laboral</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Analizar oferta laboral
            </h1>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRawText(demoOffer);
              setMessage(null);
              setAnalysis(null);
            }}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Cargar demo
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetLanguage">Idioma</Label>
            <select
              id="targetLanguage"
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:max-w-56"
              value={targetLanguage}
              onChange={(event) =>
                setTargetLanguage(event.target.value as TargetLanguage)
              }
            >
              <option value="es">Espanol</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobOffer">Texto de la oferta</Label>
            <Textarea
              id="jobOffer"
              className="min-h-[320px]"
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Pega aqui la oferta laboral..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={analyze}
              disabled={isPending || rawText.trim().length < 100}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <BriefcaseBusiness className="size-4" aria-hidden="true" />
              )}
              Analizar oferta
            </Button>
            {analysis ? (
              <Button asChild variant="outline">
                <a href="/requirements">
                  Continuar
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </div>

          {message ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </p>
          ) : null}
        </div>
      </section>

      <aside className="rounded-md border bg-white p-5 shadow-sm lg:sticky lg:top-4 lg:self-start">
        <h2 className="text-xl font-semibold tracking-normal text-slate-950">
          Resultado
        </h2>
        {analysis ? (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cargo</p>
              <p className="font-medium text-slate-950">{analysis.roleTitle}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Seniority</p>
              <p className="font-medium text-slate-950">{analysis.seniority}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Skills obligatorias</p>
              <p className="font-medium text-slate-950">
                {analysis.requiredSkills.join(", ") || "Sin datos"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Deseables</p>
              <p className="font-medium text-slate-950">
                {analysis.niceToHaveSkills.join(", ") || "Sin datos"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex min-h-64 items-center justify-center rounded-md border border-dashed bg-slate-50 p-5 text-center text-sm text-muted-foreground">
            El analisis aparecera aqui.
          </div>
        )}
      </aside>
    </div>
  );
}
