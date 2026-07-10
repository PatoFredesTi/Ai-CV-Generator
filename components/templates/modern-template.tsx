import { Github, LinkIcon, Mail, MapPin, Phone } from "lucide-react";
import { type CVData } from "@/lib/cv/schema";

export function ModernTemplate({ data }: { data: CVData }) {
  return (
    <article className="cv-paper grid grid-cols-[0.36fr_0.64fr] overflow-hidden rounded-sm border bg-white text-slate-950 shadow-sm">
      <aside className="bg-primary p-7 text-primary-foreground">
        <h2 className="text-3xl font-semibold tracking-normal">{data.personal.fullName}</h2>
        <p className="mt-3 text-base font-medium text-white/85">{data.targetRole}</p>

        <div className="mt-8 space-y-3 text-sm text-white/85">
          <p className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4" aria-hidden="true" />
            <span>{data.personal.email}</span>
          </p>
          <p className="flex items-start gap-2">
            <Phone className="mt-0.5 size-4" aria-hidden="true" />
            <span>{data.personal.phone}</span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4" aria-hidden="true" />
            <span>{data.personal.location}</span>
          </p>
          {data.personal.github ? (
            <p className="flex items-start gap-2">
              <Github className="mt-0.5 size-4" aria-hidden="true" />
              <span>{data.personal.github}</span>
            </p>
          ) : null}
          {data.personal.linkedIn ? (
            <p className="flex items-start gap-2">
              <LinkIcon className="mt-0.5 size-4" aria-hidden="true" />
              <span>{data.personal.linkedIn}</span>
            </p>
          ) : null}
          {data.personal.website ? (
            <p className="flex items-start gap-2">
              <LinkIcon className="mt-0.5 size-4" aria-hidden="true" />
              <span>{data.personal.website}</span>
            </p>
          ) : null}
        </div>

        <section className="mt-9">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
            Habilidades
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-sm bg-white/12 px-2 py-1 text-xs font-medium text-white"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-9">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">
            Educación
          </h3>
          <div className="mt-3 space-y-4 text-sm text-white/85">
            {data.education.map((item) => (
              <div key={`${item.institution}-${item.degree}`}>
                <p className="font-semibold text-white">{item.degree}</p>
                <p>{item.institution}</p>
                <p>{item.year}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <div className="p-8">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Resumen
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">{data.summary}</p>
        </section>

        <section className="mt-8">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
            Experiencia
          </h3>
          <div className="mt-4 space-y-6">
            {data.experience.map((item) => (
              <div key={`${item.company}-${item.role}`} className="border-l-2 border-secondary pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-semibold text-slate-950">{item.role}</h4>
                  <p className="text-xs font-medium text-slate-500">
                    {item.startDate} - {item.endDate}
                  </p>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-600">{item.company}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
