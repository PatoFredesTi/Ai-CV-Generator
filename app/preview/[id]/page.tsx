import { PreviewClient } from "@/components/preview/preview-client";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;

  return <PreviewClient id={id} />;
}
