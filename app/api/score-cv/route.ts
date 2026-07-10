import { cvDataSchema } from "@/lib/cv/schema";
import { jobAnalysisSchema, jobRequirementsSchema } from "@/lib/job/schema";
import { calculateCVScore } from "@/lib/scoring/calculate-score";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedCv = cvDataSchema.safeParse(body?.cv);
  const parsedAnalysis = jobAnalysisSchema.safeParse(body?.jobAnalysis);
  const parsedRequirements = jobRequirementsSchema.safeParse(body?.requirements);

  if (!parsedCv.success || !parsedAnalysis.success || !parsedRequirements.success) {
    return Response.json(
      { message: "Los datos enviados no permiten calcular el score." },
      { status: 400 },
    );
  }

  const report = calculateCVScore({
    cv: parsedCv.data,
    jobAnalysis: parsedAnalysis.data,
    requirements: parsedRequirements.data,
  });

  return Response.json(report);
}
