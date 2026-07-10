import { type CVScoreReport } from "@/lib/scoring/schema";
import { cn } from "@/lib/utils";

export function ScoreCard({ report }: { report: CVScoreReport }) {
  const tone =
    report.totalScore >= 82
      ? "border-primary/30 bg-emerald-50 text-primary"
      : report.totalScore >= 65
        ? "border-secondary/40 bg-amber-50 text-amber-700"
        : "border-destructive/30 bg-red-50 text-destructive";

  return (
    <section className={cn("rounded-md border p-5 shadow-sm", tone)}>
      <p className="text-sm font-medium">Score total</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-6xl font-semibold tracking-normal">
          {report.totalScore}
        </span>
        <span className="pb-2 text-lg font-medium">/100</span>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">
        {report.verdict}
      </p>
    </section>
  );
}
