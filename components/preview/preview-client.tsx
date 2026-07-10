"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowLeft, Download, FileText, Loader2, Pencil, SearchCheck } from "lucide-react";
import { CvPreview } from "@/components/templates/cv-preview";
import { TemplatePicker } from "@/components/templates/template-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoCv } from "@/lib/cv/demo";
import { type CVData, type CvTemplate } from "@/lib/cv/schema";

const HISTORY_KEY = "cv-history";

function readHistory(): CVData[] {
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as CVData[];
  } catch {
    return [];
  }
}

function saveCv(cv: CVData) {
  const history = readHistory();
  const next = [cv, ...history.filter((item) => item.id !== cv.id)].slice(0, 8);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PreviewClient({ id }: { id: string }) {
  const [cv, setCv] = useState<CVData | null>(id === "demo" ? demoCv : null);
  const [history, setHistory] = useState<CVData[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const items = readHistory();
    setHistory(items);

    if (id === "demo") {
      return;
    }

    const found = items.find((item) => item.id === id);
    setCv(found ?? null);
  }, [id]);

  const selectedCv = cv ?? demoCv;

  const updateCv = (updater: (current: CVData) => CVData) => {
    setCv((current) => {
      const next = updater(current ?? selectedCv);
      saveCv(next);
      setHistory(readHistory());
      return next;
    });
  };

  const skillsValue = useMemo(() => selectedCv.skills.join(", "), [selectedCv.skills]);

  const downloadPdf = () => {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedCv),
      });

      if (!response.ok) {
        setMessage("No se pudo generar el PDF.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedCv.personal.fullName || "cv"}.pdf`;
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
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/analyze-job">
              <SearchCheck className="size-4" aria-hidden="true" />
              Oferta
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/create">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Crear
            </Link>
          </Button>
          <Button size="sm" onClick={downloadPdf} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            PDF
          </Button>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 pb-12 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-md border bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2">
            <Pencil className="size-4 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold tracking-normal">Editor</h1>
          </div>

          <TemplatePicker
            value={selectedCv.template}
            onChange={(template: CvTemplate) =>
              updateCv((current) => ({ ...current, template }))
            }
          />

          <div className="space-y-2">
            <Label>Resumen</Label>
            <Textarea
              value={selectedCv.summary}
              onChange={(event) =>
                updateCv((current) => ({ ...current, summary: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Habilidades</Label>
            <Textarea
              value={skillsValue}
              onChange={(event) =>
                updateCv((current) => ({
                  ...current,
                  skills: event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>

          <div className="space-y-3">
            {selectedCv.experience.map((item, index) => (
              <div className="space-y-2" key={`${item.company}-${index}`}>
                <Label>{item.role}</Label>
                <Textarea
                  value={item.bullets.join("\n")}
                  onChange={(event) =>
                    updateCv((current) => ({
                      ...current,
                      experience: current.experience.map((experience, currentIndex) =>
                        currentIndex === index
                          ? { ...experience, bullets: splitLines(event.target.value) }
                          : experience,
                      ),
                    }))
                  }
                />
              </div>
            ))}
          </div>

          {history.length > 0 ? (
            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Historial</p>
              <div className="space-y-2">
                {history.slice(0, 3).map((item) => (
                  <Button
                    key={item.id}
                    asChild
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Link href={`/preview/${item.id}`}>{item.personal.fullName}</Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {message ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </p>
          ) : null}
        </aside>

        <div className="rounded-md border bg-white p-3 shadow-panel">
          <CvPreview data={selectedCv} />
        </div>
      </section>
    </main>
  );
}
