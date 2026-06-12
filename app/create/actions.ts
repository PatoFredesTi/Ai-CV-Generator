"use server";

import { headers } from "next/headers";
import { cvInputSchema, type CVData } from "@/lib/cv/schema";
import { buildCvFromInput } from "@/lib/cv/transform";
import { generateContentWithAi } from "@/lib/ai/generate-content";
import { checkGenerationRateLimit } from "@/lib/rate-limit";

type GenerateCvSuccess = {
  ok: true;
  cv: CVData;
  provider: "openai" | "demo";
};

type GenerateCvFailure = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type GenerateCvResult = GenerateCvSuccess | GenerateCvFailure;

export async function generateCvContent(payload: unknown): Promise<GenerateCvResult> {
  const parsed = cvInputSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados antes de generar el CV.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "local";

  const rateLimit = await checkGenerationRateLimit(ip);

  if (!rateLimit.success) {
    return {
      ok: false,
      message: "Alcanzaste el límite de 5 generaciones en 10 minutos. Intenta nuevamente más tarde.",
    };
  }

  try {
    const generated = await generateContentWithAi(parsed.data);
    const cv = buildCvFromInput(parsed.data, generated.content);

    return {
      ok: true,
      cv,
      provider: generated.provider,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      message: "No se pudo generar el contenido con IA. Revisa la configuración de API e inténtalo otra vez.",
    };
  }
}
