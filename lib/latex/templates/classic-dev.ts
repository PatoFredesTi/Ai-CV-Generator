import { type AdaptedCV } from "@/lib/cv/adapted-schema";
import { escapeLatex } from "@/lib/latex/escape-latex";
import {
  renderEducation,
  renderExperience,
  renderExtraSections,
  renderHeader,
  renderProjects,
  renderSkills,
  section,
} from "@/lib/latex/templates/shared";

export function renderClassicDevTemplate(cv: AdaptedCV) {
  return `\\documentclass[letterpaper,10.5pt]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage[utf8]{inputenc}
\\setlist[itemize]{noitemsep, topsep=2pt}
\\titleformat{\\section}{\\bfseries\\uppercase}{}{0em}{}[\\titlerule]

\\begin{document}
${renderHeader(cv)}

${section("Perfil", escapeLatex(cv.summary))}

${section("Stack Tecnico", renderSkills(cv))}

${section("Proyectos Relevantes", renderProjects(cv))}

${section("Experiencia Profesional", renderExperience(cv))}

${section("Educacion", renderEducation(cv))}

${renderExtraSections(cv)}
\\end{document}
`;
}
