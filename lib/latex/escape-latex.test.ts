import { describe, expect, it } from "vitest";
import { escapeLatex } from "@/lib/latex/escape-latex";

describe("escapeLatex", () => {
  it("escapes special characters", () => {
    expect(escapeLatex("React & TypeScript_100% $value {x}")).toBe(
      "React \\& TypeScript\\_100\\% \\$value \\{x\\}",
    );
  });

  it("does not alter normal text", () => {
    expect(escapeLatex("Frontend Developer")).toBe("Frontend Developer");
  });
});
