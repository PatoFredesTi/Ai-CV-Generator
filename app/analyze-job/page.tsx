import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { JobOfferForm } from "@/components/job/JobOfferForm";
import { Button } from "@/components/ui/button";

export default function AnalyzeJobPage() {
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
          <Link href="/create">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Crear CV
          </Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 pb-12">
        <JobOfferForm />
      </section>
    </main>
  );
}
