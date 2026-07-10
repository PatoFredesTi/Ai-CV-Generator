import { type CVScoreReport } from "@/lib/scoring/schema";

export function GapList({ report }: { report: CVScoreReport }) {
  return (
    <section className="rounded-md border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-normal text-slate-950">
        Fortalezas y brechas
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-950">Fortalezas</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-950">Debilidades</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-950">Brechas</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {report.gaps.length > 0 ? (
              report.gaps.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No hay brechas nivel 0 declaradas.</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
