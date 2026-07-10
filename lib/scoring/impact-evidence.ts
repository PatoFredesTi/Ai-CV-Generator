import { type CVData } from "@/lib/cv/schema";
import { normalizeSearchText } from "@/lib/scoring/keyword-match";

const impactPatterns = [
  /\d+\s?%/,
  /\b\d+x\b/,
  /\b\d+\s?(usuarios|clientes|horas|dias|semanas|meses|usd|clp)\b/,
  /\b(aumente|aumento|reduje|redujo|automatice|automatizo|optimice|optimizo)\b/,
  /\b(mejore|mejoro|performance|rendimiento|costo|tiempo|conversion)\b/,
];

export function countImpactEvidence(cv: CVData) {
  const bullets = cv.experience.flatMap((item) => item.bullets);

  return bullets.filter((bullet) => {
    const text = normalizeSearchText(bullet);
    return impactPatterns.some((pattern) => pattern.test(text));
  }).length;
}

export function calculateImpactRatio(cv: CVData) {
  const bullets = cv.experience.flatMap((item) => item.bullets);
  if (bullets.length === 0) {
    return 0;
  }

  return Math.min(countImpactEvidence(cv) / Math.min(bullets.length, 4), 1);
}
