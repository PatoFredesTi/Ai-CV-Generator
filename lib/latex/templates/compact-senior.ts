import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { escapeLatex } from "@/lib/latex/escape-latex";
import {
  renderCertifications,
  renderEducation,
  renderExperience,
  renderExtraSections,
  renderHeader,
  renderProjects,
  renderSkills,
  section,
} from "@/lib/latex/templates/shared";

export function renderCompactSeniorTemplate(cv: AdaptedCV) {
  return `\\documentclass[letterpaper,10pt]{article}
\\usepackage[margin=0.62in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[utf8]{inputenc}
\\setlist[itemize]{noitemsep, topsep=1pt}
\\titlespacing*{\\section}{0pt}{6pt}{4pt}
\\titleformat{\\section}{\\normalsize\\bfseries}{}{0em}{}[\\titlerule]

\\begin{document}
${renderHeader(cv)}

${section("Resumen Ejecutivo", escapeLatex(cv.summary))}

${section("Experiencia e Impacto", renderExperience(cv))}

${section("Skills Prioritarias", renderSkills(cv))}

${section("Proyectos", renderProjects(cv))}

${section("Educacion", renderEducation(cv))}

${section("Certificaciones", renderCertifications(cv))}

${renderExtraSections(cv)}
\\end{document}
`;
}
