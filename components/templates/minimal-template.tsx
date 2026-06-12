import { type CVData } from "@/lib/cv/schema";

export function MinimalTemplate({ data }: { data: CVData }) {
  return (
    <article className="cv-paper rounded-sm border bg-white p-9 text-slate-950 shadow-sm">
      <header className="grid gap-5 border-b pb-6 md:grid-cols-[1fr_0.75fr]">
        <div>
          <h2 className="text-4xl font-semibold tracking-normal">{data.personal.fullName}</h2>
          <p className="mt-2 text-base font-medium text-primary">{data.targetRole}</p>
        </div>
        <div className="space-y-1 text-sm text-slate-600 md:text-right">
          <p>{data.personal.email}</p>
          <p>{data.personal.phone}</p>
          <p>{data.personal.location}</p>
          {data.personal.linkedIn ? <p>{data.personal.linkedIn}</p> : null}
          {data.personal.website ? <p>{data.personal.website}</p> : null}
        </div>
      </header>

      <section className="mt-7 grid gap-5 md:grid-cols-[150px_1fr]">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Resumen
        </h3>
        <p className="text-sm leading-6 text-slate-700">{data.summary}</p>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-[150px_1fr]">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Experiencia
        </h3>
        <div className="space-y-6">
          {data.experience.map((item) => (
            <div key={`${item.company}-${item.role}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-semibold">{item.role}</h4>
                <p className="text-xs font-medium text-slate-500">
                  {item.startDate} - {item.endDate}
                </p>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-600">{item.company}</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>- {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-[150px_1fr]">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Educación
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {data.education.map((item) => (
            <div key={`${item.institution}-${item.degree}`}>
              <p className="text-sm font-semibold">{item.degree}</p>
              <p className="text-sm text-slate-600">{item.institution}</p>
              <p className="text-xs text-slate-500">{item.year}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7 grid gap-5 md:grid-cols-[150px_1fr]">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Habilidades
        </h3>
        <p className="text-sm leading-6 text-slate-700">{data.skills.join(" · ")}</p>
      </section>
    </article>
  );
}
