import { Github, LinkIcon, Mail, Phone } from "lucide-react";
import { type CVData } from "@/lib/cv/schema";

export function ExecutiveTemplate({ data }: { data: CVData }) {
  return (
    <article className="cv-paper rounded-sm border bg-white p-9 text-slate-950 shadow-sm">
      <header className="grid gap-6 border-b border-zinc-300 pb-7 md:grid-cols-[1fr_0.7fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Professional Profile
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-normal">
            {data.personal.fullName}
          </h2>
          <p className="mt-2 text-lg text-zinc-700">{data.targetRole}</p>
        </div>
        <div className="space-y-2 text-sm text-zinc-600 md:text-right">
          <p className="inline-flex items-center gap-2 md:justify-end">
            <Mail className="size-4" aria-hidden="true" />
            {data.personal.email}
          </p>
          <p className="inline-flex items-center gap-2 md:justify-end">
            <Phone className="size-4" aria-hidden="true" />
            {data.personal.phone}
          </p>
          {data.personal.github ? (
            <p className="inline-flex items-center gap-2 md:justify-end">
              <Github className="size-4" aria-hidden="true" />
              {data.personal.github}
            </p>
          ) : null}
          {data.personal.linkedIn ? (
            <p className="inline-flex items-center gap-2 md:justify-end">
              <LinkIcon className="size-4" aria-hidden="true" />
              {data.personal.linkedIn}
            </p>
          ) : null}
          {data.personal.website ? (
            <p className="inline-flex items-center gap-2 md:justify-end">
              <LinkIcon className="size-4" aria-hidden="true" />
              {data.personal.website}
            </p>
          ) : null}
        </div>
      </header>

      <section className="mt-7">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          Resumen ejecutivo
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-700">{data.summary}</p>
      </section>

      <section className="mt-7">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
          Experiencia e impacto
        </h3>
        <div className="mt-4 space-y-6">
          {data.experience.map((item) => (
            <div key={`${item.company}-${item.role}`} className="border-l border-zinc-300 pl-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-semibold text-zinc-950">{item.role}</h4>
                <p className="text-xs font-medium text-zinc-500">
                  {item.startDate} - {item.endDate}
                </p>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-600">{item.company}</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-700">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>- {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-8 md:grid-cols-[1fr_0.8fr]">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Competencias
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-700">{data.skills.join(" | ")}</p>
        </section>
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Educacion
          </h3>
          <div className="mt-3 space-y-3 text-sm text-zinc-700">
            {data.education.map((item) => (
              <div key={`${item.institution}-${item.degree}`}>
                <p className="font-semibold text-zinc-950">{item.degree}</p>
                <p>{item.institution}</p>
                <p className="text-zinc-500">{item.year}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
