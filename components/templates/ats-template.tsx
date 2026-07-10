import { Github, LinkIcon, Mail, MapPin, Phone } from "lucide-react";
import { type CVData } from "@/lib/cv/schema";

export function AtsTemplate({ data }: { data: CVData }) {
  return (
    <article className="cv-paper rounded-sm border bg-white p-8 text-slate-950 shadow-sm">
      <header className="text-center">
        <h2 className="text-4xl font-semibold tracking-normal">
          {data.personal.fullName}
        </h2>
        <p className="mt-2 text-lg font-medium text-slate-700">{data.targetRole}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Mail className="size-4" aria-hidden="true" />
            {data.personal.email}
          </span>
          <span className="inline-flex items-center gap-1">
            <Phone className="size-4" aria-hidden="true" />
            {data.personal.phone}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" aria-hidden="true" />
            {data.personal.location}
          </span>
          {data.personal.github ? (
            <span className="inline-flex items-center gap-1">
              <Github className="size-4" aria-hidden="true" />
              {data.personal.github}
            </span>
          ) : null}
          {data.personal.linkedIn ? (
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="size-4" aria-hidden="true" />
              {data.personal.linkedIn}
            </span>
          ) : null}
          {data.personal.website ? (
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="size-4" aria-hidden="true" />
              {data.personal.website}
            </span>
          ) : null}
        </div>
      </header>

      <section className="mt-7 border-t pt-5">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-950">
          Resumen profesional
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{data.summary}</p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-950">
          Experiencia
        </h3>
        <div className="mt-3 space-y-5">
          {data.experience.map((item) => (
            <div key={`${item.company}-${item.role}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="font-semibold text-slate-950">
                  {item.role} | {item.company}
                </h4>
                <p className="text-sm text-slate-600">
                  {item.startDate} - {item.endDate}
                </p>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-950">
          Habilidades
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{data.skills.join(", ")}</p>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-950">
          Educacion
        </h3>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          {data.education.map((item) => (
            <p key={`${item.institution}-${item.degree}`}>
              <span className="font-semibold text-slate-950">{item.degree}</span>,{" "}
              {item.institution} ({item.year})
            </p>
          ))}
        </div>
      </section>
    </article>
  );
}
