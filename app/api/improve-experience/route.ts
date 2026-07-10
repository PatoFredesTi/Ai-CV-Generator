import {
  improveExperienceInputSchema,
  improveExperienceWriting,
} from "@/lib/ai/improve-experience";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = improveExperienceInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        message: "Agrega una nota breve para mejorar la experiencia.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await improveExperienceWriting(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "No se pudo mejorar la experiencia." },
      { status: 500 },
    );
  }
}
