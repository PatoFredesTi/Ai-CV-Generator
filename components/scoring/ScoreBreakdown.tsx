import { type CVScoreReport } from "@/lib/scoring/schema";

const labels: Record<keyof CVScoreReport["categoryScores"], string> = {
  technicalMatch: "Match tecnico",
  declaredLevelMatch: "Nivel declarado",
  experienceMatch: "Experiencia relacionada",
  seniorityMatch: "Seniority",
  impactEvidence: "Impacto medible",
  atsReadability: "Claridad ATS",
  consistency: "Coherencia",
};

const maxScores: Record<keyof CVScoreReport["categoryScores"], number> = {
  technicalMatch: 30,
  declaredLevelMatch: 20,
  experienceMatch: 20,
  seniorityMatch: 10,
  impactEvidence: 10,
  atsReadability: 5,
  consistency: 5,
};

export function ScoreBreakdown({ report }: { report: CVScoreReport }) {
  return (
    <section className="rounded-md border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-normal text-slate-950">
        Desglose
      </h2>
      <div className="mt-4 space-y-4">
        {Object.entries(report.categoryScores).map(([key, value]) => {
          const typedKey = key as keyof CVScoreReport["categoryScores"];
          const max = maxScores[typedKey];
          const width = `${Math.min(100, (value / max) * 100)}%`;

          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-800">{labels[typedKey]}</span>
                <span className="text-muted-foreground">
                  {value}/{max}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
