import { describe, expect, it } from "vitest";
import { demoInput } from "@/lib/cv/demo";
import { buildCvFromInput, createFallbackGeneratedContent } from "@/lib/cv/transform";

describe("CV transform", () => {
  it("builds a valid CV from input and generated content", () => {
    const generated = createFallbackGeneratedContent(demoInput);
    const cv = buildCvFromInput(demoInput, generated, {
      id: "test-cv",
      createdAt: "2026-04-01T00:00:00.000Z",
    });

    expect(cv.id).toBe("test-cv");
    expect(cv.summary).toContain(demoInput.personal.fullName);
    expect(cv.experience).toHaveLength(demoInput.experience.length);
    expect(cv.skills.length).toBeGreaterThanOrEqual(6);
  });
});
