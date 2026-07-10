import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { escapeLatex } from "@/lib/latex/escape-latex";
import {
  renderCertifications,
  renderEducation,
  renderExperience,
  renderExtraSections,
  renderHeader,
  renderLanguages,
  renderProjects,
  renderSkills,
  section,
} from "@/lib/latex/templates/shared";

export function renderAtsModernTemplate(cv: AdaptedCV) {
  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[utf8]{inputenc}
\\setlist[itemize]{noitemsep, topsep=2pt}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]

\\begin{document}
${renderHeader(cv)}

${section("Resumen Profesional", escapeLatex(cv.summary))}

${section("Experiencia", renderExperience(cv))}

${section("Habilidades Tecnicas", renderSkills(cv))}

${section("Proyectos", renderProjects(cv))}

${section("Educacion", renderEducation(cv))}

${section("Certificaciones", renderCertifications(cv))}

${section("Idiomas", renderLanguages(cv))}

${renderExtraSections(cv)}
\\end{document}
`;
}
