import { describe, expect, it } from "vitest";
import { jobOfferInputSchema, jobRequirementSchema } from "@/lib/job/schema";

describe("job schemas", () => {
  it("validates job offer input", () => {
    const parsed = jobOfferInputSchema.parse({
      rawText: "a".repeat(120),
      targetLanguage: "es",
    });

    expect(parsed.targetLanguage).toBe("es");
  });

  it("rejects short job offers", () => {
    const parsed = jobOfferInputSchema.safeParse({
      rawText: "too short",
      targetLanguage: "en",
    });

    expect(parsed.success).toBe(false);
  });

  it("keeps user level as a strict 0 to 5 value", () => {
    expect(jobRequirementSchema.parse({
      id: "react",
      name: "React",
      userLevel: 0,
    }).userLevel).toBe(0);

    expect(jobRequirementSchema.safeParse({
      id: "react",
      name: "React",
      userLevel: 6,
    }).success).toBe(false);
  });
});
