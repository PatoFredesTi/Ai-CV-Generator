import { optimizeCVForJob } from "@/lib/ai/optimize-cv";
import { cvDataSchema } from "@/lib/cv/schema";
import { jobAnalysisSchema, jobRequirementsSchema } from "@/lib/job/schema";
import { cvScoreReportSchema } from "@/lib/scoring/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedCv = cvDataSchema.safeParse(body?.cv);
  const parsedAnalysis = jobAnalysisSchema.safeParse(body?.jobAnalysis);
  const parsedRequirements = jobRequirementsSchema.safeParse(body?.requirements);
  const parsedReport = cvScoreReportSchema.safeParse(body?.scoreReport);

  if (
    !parsedCv.success ||
    !parsedAnalysis.success ||
    !parsedRequirements.success ||
    !parsedReport.success
  ) {
    return Response.json(
      { message: "Los datos enviados no permiten adaptar el CV." },
      { status: 400 },
    );
  }

  try {
    const cv = await optimizeCVForJob({
      cv: parsedCv.data,
      jobAnalysis: parsedAnalysis.data,
      requirements: parsedRequirements.data,
      scoreReport: parsedReport.data,
    });

    return Response.json(cv);
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "No se pudo adaptar el CV." },
      { status: 500 },
    );
  }
}
