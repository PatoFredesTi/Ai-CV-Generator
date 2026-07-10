import Link from "next/link";
import { ArrowLeft, FileText, SearchCheck } from "lucide-react";
import { CreateCvForm } from "@/components/form/create-cv-form";
import { Button } from "@/components/ui/button";

export default function CreatePage() {
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
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Inicio
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/analyze-job">
              <SearchCheck className="size-4" aria-hidden="true" />
              Oferta
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12">
        <CreateCvForm />
      </section>
    </main>
  );
}
