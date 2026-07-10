import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { escapeLatex } from "@/lib/latex/escape-latex";

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/[%{}\\]/g, "");
}

function link(label: string, url?: string) {
  if (!url) {
    return "";
  }

  const normalized = normalizeUrl(url);
  if (!normalized) {
    return "";
  }

  return `\\href{${normalized}}{${escapeLatex(label)}}`;
}

export function renderHeader(cv: AdaptedCV) {
  const linkedIn = link("LinkedIn", cv.personalInfo.linkedIn);
  const github = link("GitHub", cv.personalInfo.github);
  const website = link("Portafolio", cv.personalInfo.website);
  const contacts = [
    cv.personalInfo.email,
    cv.personalInfo.phone,
    cv.personalInfo.location,
  ]
    .filter(Boolean)
    .map(escapeLatex);

  const links = [linkedIn, github, website].filter(Boolean);
  const contactLine = [...contacts, ...links].join(" $|$ ");

  return `\\begin{center}
    {\\Huge \\textbf{${escapeLatex(cv.personalInfo.fullName)}}}\\\\
    ${escapeLatex(cv.targetRole)}\\\\
    ${contactLine}
\\end{center}`;
}

export function renderExperience(cv: AdaptedCV) {
  return cv.experience
    .map(
      (item) => `\\textbf{${escapeLatex(item.role)}} \\hfill ${escapeLatex(item.startDate)} -- ${escapeLatex(item.endDate)}\\\\
\\textit{${escapeLatex(item.company)}}\\\\
\\begin{itemize}[leftmargin=*]
${item.bullets.map((bullet) => `  \\item ${escapeLatex(bullet)}`).join("\n")}
\\end{itemize}`,
    )
    .join("\n\n");
}

export function renderSkills(cv: AdaptedCV) {
  if (cv.skills.length === 0) {
    return "";
  }

  return cv.skills
    .map(
      (group) =>
        `\\textbf{${escapeLatex(group.name)}}: ${group.items.map(escapeLatex).join(", ")}`,
    )
    .join("\\\\\n");
}

export function renderProjects(cv: AdaptedCV) {
  if (cv.projects.length === 0) {
    return "";
  }

  return cv.projects
    .map((project) => {
      const techs =
        project.technologies.length > 0
          ? `\\\\ \\textit{Stack: ${project.technologies.map(escapeLatex).join(", ")}}`
          : "";
      const description = project.description
        ? `\\\\ ${escapeLatex(project.description)}`
        : "";
      const bullets =
        project.bullets.length > 0
          ? `\\begin{itemize}[leftmargin=*]
${project.bullets.map((bullet) => `  \\item ${escapeLatex(bullet)}`).join("\n")}
\\end{itemize}`
          : "";

      return `\\textbf{${escapeLatex(project.name)}}${description}${techs}
${bullets}`;
    })
    .join("\n\n");
}

export function renderEducation(cv: AdaptedCV) {
  return cv.education
    .map(
      (item) =>
        `\\textbf{${escapeLatex(item.degree)}} -- ${escapeLatex(item.institution)} \\hfill ${escapeLatex(item.year)}`,
    )
    .join("\\\\\n");
}

export function renderCertifications(cv: AdaptedCV) {
  if (cv.certifications.length === 0) {
    return "";
  }

  return cv.certifications
    .map((item) =>
      [item.name, item.issuer, item.year]
        .filter((value): value is string => Boolean(value))
        .map(escapeLatex)
        .join(" -- "),
    )
    .join("\\\\\n");
}

export function renderLanguages(cv: AdaptedCV) {
  if (cv.languages.length === 0) {
    return "";
  }

  return cv.languages
    .map((item) => `${escapeLatex(item.name)}: ${escapeLatex(item.level)}`)
    .join("\\\\\n");
}

export function renderExtraSections(cv: AdaptedCV) {
  return cv.extraSections
    .filter((extra) => extra.items.length > 0)
    .map(
      (extra) => `${section(
        extra.title,
        `\\begin{itemize}[leftmargin=*]
${extra.items.map((item) => `  \\item ${escapeLatex(item)}`).join("\n")}
\\end{itemize}`,
      )}`,
    )
    .join("\n\n");
}

export function section(title: string, content: string) {
  if (!content.trim()) {
    return "";
  }

  return `\\section*{${escapeLatex(title)}}
${content}`;
}
