"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, FileText, Loader2, Sparkles } from "lucide-react";
import { AdaptedCvPreview } from "@/components/cv/AdaptedCvPreview";
import { HonestyWarnings } from "@/components/cv/HonestyWarnings";
import { Button } from "@/components/ui/button";
import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { demoCv } from "@/lib/cv/demo";
import { type CVData } from "@/lib/cv/schema";
import {
  ADAPTED_CV_KEY,
  readAdaptedCv,
  readJobAnalysis,
  readLatestCv,
  readRequirements,
  readScoreReport,
  writeJson,
} from "@/lib/workflow/storage";

export default function AdaptedCvPage() {
  const [cv, setCv] = useState<CVData>(demoCv);
  const [adaptedCv, setAdaptedCv] = useState<AdaptedCV | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCv(readLatestCv() ?? demoCv);
    setAdaptedCv(readAdaptedCv());
  }, []);

  const adapt = () => {
    const jobAnalysis = readJobAnalysis();
    const requirements = readRequirements();
    const scoreReport = readScoreReport();

    if (!jobAnalysis || requirements.length === 0 || !scoreReport) {
      setMessage("Primero calcula el reporte de compatibilidad.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/optimize-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cv, jobAnalysis, requirements, scoreReport }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.message ?? "No se pudo adaptar el CV.");
        return;
      }

      writeJson(ADAPTED_CV_KEY, payload);
      setAdaptedCv(payload);
    });
  };

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          AI LaTeX CV Studio
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link href="/match-report">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Reporte
          </Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-7xl space-y-5 px-5 pb-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{cv.personal.fullName}</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              CV adaptado
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={adapt} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              Adaptar CV
            </Button>
            {adaptedCv ? (
              <Button asChild variant="outline">
                <Link href="/extras">
                  Agregar extras
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {message}
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/match-report">Ir al reporte</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {adaptedCv ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <AdaptedCvPreview cv={adaptedCv} />
            <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
              <HonestyWarnings warnings={adaptedCv.warnings} />
              <Button asChild className="w-full">
                <Link href="/extras">
                  Agregar extras
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/review-loop">
                  Ciclo de mejora
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-md border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
            {isPending ? "Adaptando CV..." : "Genera una version adaptada para continuar."}
          </div>
        )}
      </section>
    </main>
  );
}
