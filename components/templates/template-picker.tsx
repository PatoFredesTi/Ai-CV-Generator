"use client";

import { Check, LayoutTemplate } from "lucide-react";
import { type CvTemplate } from "@/lib/cv/schema";
import { cn } from "@/lib/utils";

const templates: Array<{
  id: CvTemplate;
  label: string;
  swatch: string;
}> = [
  { id: "classic", label: "Clásico", swatch: "bg-slate-900" },
  { id: "modern", label: "Moderno", swatch: "bg-primary" },
  { id: "minimal", label: "Minimal", swatch: "bg-secondary" },
  { id: "ats", label: "ATS", swatch: "bg-emerald-700" },
  { id: "developer", label: "Developer", swatch: "bg-sky-700" },
  { id: "executive", label: "Executive", swatch: "bg-zinc-700" },
];

export function TemplatePicker({
  value,
  onChange,
}: {
  value: CvTemplate;
  onChange: (template: CvTemplate) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-900">Template</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {templates.map((template) => {
          const selected = template.id === value;

          return (
            <button
              key={template.id}
              type="button"
              className={cn(
                "flex min-h-20 flex-col items-start justify-between rounded-md border bg-white p-3 text-left text-sm font-medium transition-colors",
                selected ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted",
              )}
              onClick={() => onChange(template.id)}
            >
              <span className="flex w-full items-center justify-between">
                <span className={cn("size-5 rounded-sm", template.swatch)} />
                {selected ? (
                  <Check className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <LayoutTemplate className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              {template.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
