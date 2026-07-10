"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type UserLevel } from "@/lib/job/schema";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
}: {
  value: UserLevel;
  onChange: (value: UserLevel) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={value === 0 ? "default" : "outline"}
        className="h-8 px-2 text-xs"
        aria-pressed={value === 0}
        onClick={() => onChange(0)}
      >
        No lo manejo
      </Button>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            className="flex size-8 items-center justify-center rounded-md text-amber-500 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Nivel ${level}`}
            aria-pressed={value === level}
            onClick={() => onChange(level as UserLevel)}
          >
            <Star
              className={cn(
                "size-5",
                value >= level ? "fill-current" : "fill-transparent text-slate-300",
              )}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
