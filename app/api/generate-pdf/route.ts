import React from "react";
import { Readable } from "node:stream";
import { renderToStream } from "@react-pdf/renderer";
import { CvPdfDocument } from "@/components/pdf/cv-pdf-document";
import { adaptedCvSchema, adaptedCvToCvData } from "@/lib/cv/adapted-schema";
import { cvDataSchema } from "@/lib/cv/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = cvDataSchema.safeParse(body);
  const parsedAdapted = adaptedCvSchema.safeParse(body);

  if (!parsed.success && !parsedAdapted.success) {
    return Response.json(
      { message: "El CV enviado no tiene el formato esperado." },
      { status: 400 },
    );
  }

  const data = parsed.success
    ? parsed.data
    : parsedAdapted.success
      ? adaptedCvToCvData(parsedAdapted.data, {
          id: "adapted-pdf",
        })
      : null;

  if (!data) {
    return Response.json(
      { message: "El CV enviado no tiene el formato esperado." },
      { status: 400 },
    );
  }

  const pdfDocument = React.createElement(CvPdfDocument, {
    data,
  }) as Parameters<typeof renderToStream>[0];
  const stream = await renderToStream(pdfDocument);

  const filename = data.personal.fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");

  return new Response(Readable.toWeb(stream as Readable) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename || "cv"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
