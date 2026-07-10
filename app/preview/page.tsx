"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, Clipboard, Download, FileText, Loader2 } from "lucide-react";
import { DownloadTexButton } from "@/components/latex/DownloadTexButton";
import { LatexPreview } from "@/components/latex/LatexPreview";
import { TemplateSelector } from "@/components/latex/TemplateSelector";
import { Button } from "@/components/ui/button";
import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { type CvTemplate } from "@/lib/cv/schema";
import { type LatexOutput, type LatexTemplateId } from "@/lib/latex/schema";
import {
  LATEX_OUTPUT_KEY,
  readAdaptedCv,
  writeJson,
} from "@/lib/workflow/storage";

const visualToLatexTemplate: Record<CvTemplate, LatexTemplateId> = {
  classic: "classic-dev",
  modern: "ats-modern",
  minimal: "ats-modern",
  ats: "ats-modern",
  developer: "classic-dev",
  executive: "compact-senior",
};

export default function LatexPreviewPage() {
  const [cv, setCv] = useState<AdaptedCV | null>(null);
  const [templateId, setTemplateId] = useState<LatexTemplateId>("ats-modern");
  const [output, setOutput] = useState<LatexOutput | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const storedCv = readAdaptedCv();
    setCv(storedCv);
    if (storedCv?.template) {
      setTemplateId(visualToLatexTemplate[storedCv.template]);
    }
  }, []);

  const generate = (nextTemplate = templateId) => {
    if (!cv) {
      setMessage("Primero genera un CV adaptado.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/generate-latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cv, templateId: nextTemplate }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.message ?? "No se pudo generar LaTeX.");
        return;
      }

      writeJson(LATEX_OUTPUT_KEY, payload);
      setOutput(payload);
    });
  };

  useEffect(() => {
    if (cv) {
      generate(templateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv, templateId]);

  const copyLatex = async () => {
    if (!output?.latexSource) {
      return;
    }

    await navigator.clipboard.writeText(output.latexSource);
    setMessage("LaTeX copiado.");
  };

  const downloadPdf = () => {
    if (!cv) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cv),
      });

      if (!response.ok) {
        setMessage("No se pudo generar el PDF fallback.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${cv.personalInfo.fullName || "cv"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
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
          <Link href="/review-loop">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Mejora
          </Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-7xl space-y-5 px-5 pb-12">
        <div className="rounded-md border bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Salida LaTeX</p>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                Preview y descarga
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={copyLatex}
                disabled={!output?.latexSource}
              >
                <Clipboard className="size-4" aria-hidden="true" />
                Copiar
              </Button>
              {output && cv ? (
                <DownloadTexButton
                  latexSource={output.latexSource}
                  fullName={cv.personalInfo.fullName}
                />
              ) : null}
              <Button type="button" variant="outline" onClick={downloadPdf} disabled={!cv || isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-4" aria-hidden="true" />
                )}
                PDF fallback
              </Button>
            </div>
          </div>
          <TemplateSelector
            value={templateId}
            onChange={(value) => {
              setTemplateId(value);
              setOutput(null);
            }}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            El PDF actual usa el fallback visual con React-PDF; el archivo `.tex`
            es la salida principal de este flujo.
          </p>
        </div>

        {message ? (
          <p className="rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-sm">
            {message}
          </p>
        ) : null}

        {cv ? (
          <LatexPreview cv={cv} latexSource={output?.latexSource ?? ""} />
        ) : (
          <div className="rounded-md border bg-white p-6 text-center shadow-sm">
            <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
              No hay CV adaptado
            </h2>
            <Button asChild className="mt-5">
              <Link href="/adapted-cv">Generar CV adaptado</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
