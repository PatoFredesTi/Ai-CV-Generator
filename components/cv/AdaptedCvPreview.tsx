import { type AdaptedCV } from "@/lib/cv/adapted-schema";

export function AdaptedCvPreview({ cv }: { cv: AdaptedCV }) {
  return (
    <article className="rounded-md border bg-white p-5 shadow-sm">
      <header className="border-b pb-4">
        <h2 className="text-3xl font-semibold tracking-normal text-slate-950">
          {cv.personalInfo.fullName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{cv.targetRole}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {[
            cv.personalInfo.email,
            cv.personalInfo.phone,
            cv.personalInfo.location,
            cv.personalInfo.linkedIn,
            cv.personalInfo.github,
            cv.personalInfo.website,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <section className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
          Resumen
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-700">{cv.summary}</p>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
          Experiencia
        </h3>
        <div className="mt-3 space-y-4">
          {cv.experience.map((item) => (
            <div key={`${item.company}-${item.role}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-slate-950">{item.role}</p>
                <p className="text-xs text-muted-foreground">
                  {item.startDate} - {item.endDate}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{item.company}</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>- {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
          Skills
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {cv.skills.map((group) => (
            <div key={group.name} className="rounded-md border bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-950">{group.name}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {group.items.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
          Educacion
        </h3>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {cv.education.map((item) => (
            <p key={`${item.institution}-${item.degree}`}>
              <span className="font-medium">{item.degree}</span> · {item.institution} ·{" "}
              {item.year}
            </p>
          ))}
        </div>
      </section>

      {cv.projects.length > 0 ? (
        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            Proyectos
          </h3>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            {cv.projects.map((project) => (
              <div key={project.name}>
                <p className="font-medium text-slate-950">{project.name}</p>
                {project.description ? <p>{project.description}</p> : null}
                {project.technologies.length > 0 ? (
                  <p className="text-muted-foreground">
                    {project.technologies.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {cv.languages.length > 0 ? (
        <section className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            Idiomas
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {cv.languages.map((item) => `${item.name}: ${item.level}`).join(" · ")}
          </p>
        </section>
      ) : null}

      {cv.extraSections.map((section) => (
        <section key={section.id} className="mt-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            {section.title}
          </h3>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            {section.items.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
