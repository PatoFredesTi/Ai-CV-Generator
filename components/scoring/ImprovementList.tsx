import { type CVImprovement } from "@/lib/scoring/schema";

const priorityLabel: Record<CVImprovement["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function ImprovementList({
  improvements,
}: {
  improvements: CVImprovement[];
}) {
  return (
    <section className="rounded-md border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold tracking-normal text-slate-950">
        Recomendaciones
      </h2>
      <div className="mt-4 space-y-3">
        {improvements.length > 0 ? (
          improvements.map((item, index) => (
            <article key={`${item.issue}-${index}`} className="rounded-md border bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground">
                  {priorityLabel[item.priority]}
                </span>
                <span className="text-muted-foreground">{item.section}</span>
              </div>
              <p className="text-sm font-medium text-slate-950">{item.issue}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.suggestion}
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay recomendaciones criticas para este reporte.
          </p>
        )}
      </div>
    </section>
  );
}
