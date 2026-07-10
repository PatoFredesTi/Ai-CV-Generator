import { analyzeJobOffer } from "@/lib/ai/analyze-job";
import { jobOfferInputSchema } from "@/lib/job/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = jobOfferInputSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        message: "La oferta laboral no tiene el formato esperado.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyzeJobOffer(parsed.data);
    return Response.json(analysis);
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "No se pudo analizar la oferta laboral." },
      { status: 500 },
    );
  }
}
