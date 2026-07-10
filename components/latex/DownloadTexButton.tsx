"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function filenameFromName(name: string) {
  return `${name || "cv"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

export function DownloadTexButton({
  latexSource,
  fullName,
}: {
  latexSource: string;
  fullName: string;
}) {
  const download = () => {
    const blob = new Blob([latexSource], { type: "text/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filenameFromName(fullName) || "cv"}.tex`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" onClick={download} disabled={!latexSource}>
      <Download className="size-4" aria-hidden="true" />
      Descargar .tex
    </Button>
  );
}
