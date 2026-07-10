import { type AdaptedCV } from "@/lib/cv/adapted-schema";

export function LatexPreview({
  cv,
  latexSource,
}: {
  cv: AdaptedCV;
  latexSource: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <article className="rounded-md border bg-white p-5 shadow-sm">
        <header className="border-b pb-4">
          <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
            {cv.personalInfo.fullName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{cv.targetRole}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
        <section className="mt-4">
          <p className="text-sm leading-7 text-slate-700">{cv.summary}</p>
        </section>
        <section className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            Skills
          </h3>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {cv.skills.map((group) => (
              <p key={group.name}>
                <span className="font-medium">{group.name}:</span>{" "}
                {group.items.join(", ")}
              </p>
            ))}
          </div>
        </section>

        {cv.projects.length > 0 ? (
          <section className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              Proyectos
            </h3>
            <div className="mt-2 space-y-2 text-sm text-slate-700">
              {cv.projects.map((project) => (
                <p key={project.name}>
                  <span className="font-medium">{project.name}:</span>{" "}
                  {project.description ?? project.technologies.join(", ")}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        {cv.extraSections.map((section) => (
          <section key={section.id} className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              {section.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {section.items.join(" · ")}
            </p>
          </section>
        ))}
      </article>

      <pre className="max-h-[720px] overflow-auto rounded-md border bg-slate-950 p-4 text-xs leading-5 text-slate-100 shadow-sm">
        <code>{latexSource || "Sin codigo generado."}</code>
      </pre>
    </div>
  );
}
