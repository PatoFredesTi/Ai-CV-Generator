import Link from "next/link";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { GeneratedCounter } from "@/components/generated-counter";
import { Button } from "@/components/ui/button";
import { CvPreview } from "@/components/templates/cv-preview";
import { demoCv } from "@/lib/cv/demo";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          AI CV Studio
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/preview/demo">Demo</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/create">
              Crear CV
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-12 pt-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="pt-6 lg:pt-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Next.js 15 + OpenAI + PDF
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-normal text-slate-950 md:text-6xl">
            Generador de CVs con IA
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Captura experiencia, optimiza contenido profesional y exporta un PDF listo para postular.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/create">
                Empezar
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/preview/demo">Ver demo</Link>
            </Button>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 divide-x rounded-md border bg-white shadow-sm">
            <div className="px-4 py-4">
              <p className="text-2xl font-semibold text-slate-950">
                <GeneratedCounter />
              </p>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                CVs
              </p>
            </div>
            <div className="px-4 py-4">
              <p className="text-2xl font-semibold text-slate-950">3</p>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Templates
              </p>
            </div>
            <div className="px-4 py-4">
              <p className="text-2xl font-semibold text-slate-950">PDF</p>
              <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Export
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-white p-3 shadow-panel">
          <CvPreview data={demoCv} />
        </div>
      </section>
    </main>
  );
}
