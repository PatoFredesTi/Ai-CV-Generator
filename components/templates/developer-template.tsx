import { Github, LinkIcon, Mail, MapPin } from "lucide-react";
import { type CVData } from "@/lib/cv/schema";

export function DeveloperTemplate({ data }: { data: CVData }) {
  const primarySkills = data.skills.slice(0, 6);
  const secondarySkills = data.skills.slice(6);

  return (
    <article className="cv-paper overflow-hidden rounded-sm border bg-white text-slate-950 shadow-sm">
      <header className="bg-slate-950 p-8 text-white">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">
          Developer CV
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-normal">
          {data.personal.fullName}
        </h2>
        <p className="mt-2 text-lg text-slate-200">{data.targetRole}</p>
        <div className="mt-5 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <span className="inline-flex items-center gap-2">
            <Mail className="size-4" aria-hidden="true" />
            {data.personal.email}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-4" aria-hidden="true" />
            {data.personal.location}
          </span>
          {data.personal.github ? (
            <span className="inline-flex items-center gap-2">
              <Github className="size-4" aria-hidden="true" />
              {data.personal.github}
            </span>
          ) : null}
          {data.personal.linkedIn ? (
            <span className="inline-flex items-center gap-2">
              <LinkIcon className="size-4" aria-hidden="true" />
              {data.personal.linkedIn}
            </span>
          ) : null}
          {data.personal.website ? (
            <span className="inline-flex items-center gap-2">
              <LinkIcon className="size-4" aria-hidden="true" />
              {data.personal.website}
            </span>
          ) : null}
        </div>
      </header>

      <div className="grid gap-0 md:grid-cols-[0.38fr_0.62fr]">
        <aside className="bg-slate-100 p-7">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Stack principal
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {primarySkills.map((skill) => (
                <span key={skill} className="rounded-sm bg-sky-700 px-2 py-1 text-xs font-medium text-white">
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {secondarySkills.length > 0 ? (
            <section className="mt-7">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Complementarias
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {secondarySkills.join(", ")}
              </p>
            </section>
          ) : null}

          <section className="mt-7">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Educacion
            </h3>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {data.education.map((item) => (
                <div key={`${item.institution}-${item.degree}`}>
                  <p className="font-semibold text-slate-950">{item.degree}</p>
                  <p>{item.institution}</p>
                  <p className="text-slate-500">{item.year}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="p-8">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
              Perfil
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">{data.summary}</p>
          </section>

          <section className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">
              Experiencia tecnica
            </h3>
            <div className="mt-4 space-y-6">
              {data.experience.map((item) => (
                <div key={`${item.company}-${item.role}`}>
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
      </div>
    </article>
  );
}
