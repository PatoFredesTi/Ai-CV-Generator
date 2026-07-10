"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { AdaptedCvPreview } from "@/components/cv/AdaptedCvPreview";
import { Button } from "@/components/ui/button";
import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { type ReviewLoopState, type ReviewStepId } from "@/lib/review/schema";
import {
  ADAPTED_CV_KEY,
  REVIEW_LOOP_KEY,
  readAdaptedCv,
  readJobAnalysis,
  readRequirements,
  readReviewLoopState,
  readScoreReport,
  writeJson,
} from "@/lib/workflow/storage";

const steps: Array<{
  id: ReviewStepId;
  title: string;
  description: string;
}> = [
  {
    id: "senior_recruiter_audit",
    title: "Auditoria de reclutador senior",
    description:
      "Puntaje sobre 100, 5 keywords faltantes y 3 senales de alerta visibles en 10 segundos.",
  },
  {
    id: "xyz_experience_rewrite",
    title: "Reescritura X/Y/Z",
    description:
      "Reescribe experiencia con Logre X, medido por Y, haciendo Z, sin inventar metricas.",
  },
  {
    id: "ats_hiring_manager_scan",
    title: "Escaneo ATS + gerente",
    description:
      "Detecta secciones que serian ignoradas y las reescribe para captar atencion.",
  },
  {
    id: "ats_style_review",
    title: "Revision de estilo ATS",
    description:
      "Revisa cabecera, resumen, bullets, links y legibilidad sin cambiar el template elegido.",
  },
  {
    id: "final_reassessment",
    title: "Reevaluacion final",
    description:
      "Vuelve a puntuar el CV con keywords faltantes y red flags despues de los cambios.",
  },
];

const defaultSelection: Record<ReviewStepId, boolean> = {
  senior_recruiter_audit: true,
  xyz_experience_rewrite: true,
  ats_hiring_manager_scan: true,
  ats_style_review: true,
  final_reassessment: true,
};

function scoreDelta(state: ReviewLoopState | null) {
  const start = state?.recruiterAudit?.compatibilityScore;
  const end = state?.finalAudit?.compatibilityScore;

  if (!start || !end) {
    return null;
  }

  return end - start;
}

export function ReviewLoopClient() {
  const [cv, setCv] = useState<AdaptedCV | null>(null);
  const [state, setState] = useState<ReviewLoopState | null>(null);
  const [selected, setSelected] =
    useState<Record<ReviewStepId, boolean>>(defaultSelection);
  const [runningStep, setRunningStep] = useState<ReviewStepId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const storedState = readReviewLoopState();
    const storedCv = storedState?.currentCv ?? readAdaptedCv();
    setCv(storedCv);
    setState(storedState);
  }, []);

  const selectedSteps = useMemo(
    () => steps.filter((step) => selected[step.id]),
    [selected],
  );

  const runSelected = () => {
    const jobAnalysis = readJobAnalysis();
    const requirements = readRequirements();
    const scoreReport = readScoreReport();

    if (!cv || !jobAnalysis || requirements.length === 0) {
      setMessage("Primero adapta el CV y conserva el analisis de la oferta.");
      return;
    }

    if (selectedSteps.length === 0) {
      setMessage("Marca al menos una casilla para ejecutar el ciclo.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      let currentState = state;
      let currentCv = currentState?.currentCv ?? cv;

      for (const step of selectedSteps) {
        setRunningStep(step.id);
        const response = await fetch("/api/review-loop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stepId: step.id,
            cv: currentCv,
            jobAnalysis,
            requirements,
            scoreReport,
            previousState: currentState ?? undefined,
          }),
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          setMessage(payload?.message ?? "No se pudo ejecutar la revision.");
          setRunningStep(null);
          return;
        }

        currentState = payload.state;
        currentCv = payload.state.currentCv;
        setState(currentState);
        setCv(currentCv);
        writeJson(REVIEW_LOOP_KEY, currentState);
        writeJson(ADAPTED_CV_KEY, currentCv);
      }

      setRunningStep(null);
      setMessage("Iteracion completada. Puedes repetir el ciclo o continuar al LaTeX.");
    });
  };

  const resetLoop = () => {
    const original = readAdaptedCv();
    if (!original) {
      setMessage("No hay CV adaptado para reiniciar.");
      return;
    }

    window.localStorage.removeItem(REVIEW_LOOP_KEY);
    setCv(original);
    setState(null);
    setMessage("Ciclo reiniciado desde el CV adaptado actual.");
  };

  if (!cv) {
    return (
      <div className="rounded-md border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          No hay CV adaptado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Genera primero una version adaptada antes de entrar al ciclo de mejora.
        </p>
        <Button asChild className="mt-5">
          <Link href="/adapted-cv">Ir a CV adaptado</Link>
        </Button>
      </div>
    );
  }

  const delta = scoreDelta(state);

  return (
    <div className="space-y-5">
      <section className="rounded-md border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Ciclo de mejora</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Reevaluacion y optimizacion del CV
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={resetLoop}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Reiniciar
            </Button>
            <Button type="button" onClick={runSelected} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ClipboardCheck className="size-4" aria-hidden="true" />
              )}
              Ejecutar casillas
            </Button>
            <Button asChild variant="outline">
              <Link href="/extras">
                Extras
                <Plus className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/preview">
                LaTeX
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {steps.map((step) => (
            <label
              key={step.id}
              className="flex min-h-28 cursor-pointer gap-3 rounded-md border bg-slate-50 p-4 transition-colors hover:bg-muted"
            >
              <input
                type="checkbox"
                className="mt-1 size-4 accent-primary"
                checked={selected[step.id]}
                onChange={(event) =>
                  setSelected((current) => ({
                    ...current,
                    [step.id]: event.target.checked,
                  }))
                }
              />
              <span>
                <span className="flex items-center gap-2 font-semibold text-slate-950">
                  {step.title}
                  {runningStep === step.id ? (
                    <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
                  ) : null}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {step.description}
                </span>
              </span>
            </label>
          ))}
        </div>

        {message ? (
          <p className="mt-4 rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </section>

      {state ? (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <article className="rounded-md border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                Puntuacion
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Inicial
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-slate-950">
                    {state.recruiterAudit?.compatibilityScore ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Final
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-slate-950">
                    {state.finalAudit?.compatibilityScore ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Delta
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-primary">
                    {delta === null ? "--" : delta >= 0 ? `+${delta}` : delta}
                  </p>
                </div>
              </div>
            </article>

            <article className="rounded-md border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                Keywords y alertas
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-950">
                    Keywords faltantes
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(state.finalAudit?.missingKeywords ??
                      state.recruiterAudit?.missingKeywords ??
                      []).map((keyword) => (
                      <li key={keyword}>{keyword}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-950">
                    Senales de alerta
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(state.finalAudit?.redFlags ??
                      state.recruiterAudit?.redFlags ??
                      []).map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            {state.ignoredSections.length > 0 ? (
              <article className="rounded-md border bg-white p-5 shadow-sm">
                <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                  Secciones ignoradas
                </h2>
                <div className="mt-4 space-y-3">
                  {state.ignoredSections.map((item) => (
                    <div key={`${item.section}-${item.reason}`} className="rounded-md border bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-950">{item.section}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.rewrite}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {state.warnings.length > 0 ? (
              <article className="rounded-md border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm">
                <div className="mb-3 flex items-center gap-2 font-semibold">
                  <ShieldAlert className="size-4" aria-hidden="true" />
                  Warnings de honestidad
                </div>
                <ul className="space-y-2 text-sm leading-6">
                  {state.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </article>
            ) : null}
          </div>

          <div className="space-y-5">
            <AdaptedCvPreview cv={state.currentCv} />
            <article className="rounded-md border bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold tracking-normal text-slate-950">
                Historial
              </h2>
              <div className="mt-4 space-y-3">
                {state.versions.map((version) => (
                  <div key={version.id} className="rounded-md border bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-950">{version.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {version.scoreBefore ? `${version.scoreBefore} -> ` : ""}
                      {version.scoreAfter ?? "sin score"}
                    </p>
                    {version.notes.length > 0 ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {version.notes.slice(0, 3).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      ) : (
        <div className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
          Ejecuta las casillas para crear la primera iteracion de mejora.
        </div>
      )}
    </div>
  );
}
