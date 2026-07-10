"use client";

import { Check } from "lucide-react";
import { type LatexTemplateId } from "@/lib/latex/schema";
import { cn } from "@/lib/utils";

const templates: Array<{
  id: LatexTemplateId;
  label: string;
}> = [
  { id: "ats-modern", label: "ATS Modern" },
  { id: "classic-dev", label: "Classic Developer" },
  { id: "compact-senior", label: "Compact Senior" },
];

export function TemplateSelector({
  value,
  onChange,
}: {
  value: LatexTemplateId;
  onChange: (value: LatexTemplateId) => void;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          className={cn(
            "flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === template.id
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-white text-slate-800 hover:bg-muted",
          )}
          aria-pressed={value === template.id}
          onClick={() => onChange(template.id)}
        >
          {template.label}
          {value === template.id ? <Check className="size-4" aria-hidden="true" /> : null}
        </button>
      ))}
    </div>
  );
}
