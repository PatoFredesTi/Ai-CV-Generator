"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, FileText, Loader2 } from "lucide-react";
import { GapList } from "@/components/scoring/GapList";
import { ImprovementList } from "@/components/scoring/ImprovementList";
import { ScoreBreakdown } from "@/components/scoring/ScoreBreakdown";
import { ScoreCard } from "@/components/scoring/ScoreCard";
import { Button } from "@/components/ui/button";
import { demoCv } from "@/lib/cv/demo";
import { type CVData } from "@/lib/cv/schema";
import { type CVScoreReport } from "@/lib/scoring/schema";
import {
  SCORE_REPORT_KEY,
  readJobAnalysis,
  readLatestCv,
  readRequirements,
  writeJson,
} from "@/lib/workflow/storage";

export default function MatchReportPage() {
  const [cv, setCv] = useState<CVData>(demoCv);
  const [report, setReport] = useState<CVScoreReport | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCv(readLatestCv() ?? demoCv);
  }, []);

  const calculate = () => {
    const jobAnalysis = readJobAnalysis();
    const requirements = readRequirements();

    if (!jobAnalysis || requirements.length === 0) {
      setMessage("Primero analiza una oferta y revisa sus requerimientos.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/score-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cv, jobAnalysis, requirements }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.message ?? "No se pudo calcular el score.");
        return;
      }

      writeJson(SCORE_REPORT_KEY, payload);
      setReport(payload);
    });
  };

  useEffect(() => {
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv.id]);

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
          <Link href="/requirements">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Requisitos
          </Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-7xl space-y-5 px-5 pb-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{cv.personal.fullName}</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Reporte de compatibilidad
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={calculate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Recalcular
            </Button>
            {report ? (
              <Button asChild>
                <Link href="/adapted-cv">
                  Adaptar mi CV
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
                <Link href="/analyze-job">Analizar oferta</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {report ? (
          <>
            <ScoreCard report={report} />
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <ScoreBreakdown report={report} />
              <ImprovementList improvements={report.improvements} />
            </div>
            <GapList report={report} />
          </>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-md border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
            {isPending ? "Calculando score..." : "Sin reporte disponible."}
          </div>
        )}
      </section>
    </main>
  );
}
