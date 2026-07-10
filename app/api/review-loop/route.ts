import { runReviewLoopStep } from "@/lib/ai/review-loop";
import { reviewLoopRequestSchema } from "@/lib/review/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reviewLoopRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        message: "Los datos enviados no permiten ejecutar la revision.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await runReviewLoopStep(parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "No se pudo ejecutar el ciclo de revision." },
      { status: 500 },
    );
  }
}
