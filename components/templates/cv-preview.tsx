import { type CVData } from "@/lib/cv/schema";
import { cn } from "@/lib/utils";
import { AtsTemplate } from "./ats-template";
import { ClassicTemplate } from "./classic-template";
import { DeveloperTemplate } from "./developer-template";
import { ExecutiveTemplate } from "./executive-template";
import { MinimalTemplate } from "./minimal-template";
import { ModernTemplate } from "./modern-template";

export function CvPreview({
  data,
  className,
}: {
  data: CVData;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[820px]", className)}>
      {data.template === "classic" ? <ClassicTemplate data={data} /> : null}
      {data.template === "modern" ? <ModernTemplate data={data} /> : null}
      {data.template === "minimal" ? <MinimalTemplate data={data} /> : null}
      {data.template === "ats" ? <AtsTemplate data={data} /> : null}
      {data.template === "developer" ? <DeveloperTemplate data={data} /> : null}
      {data.template === "executive" ? <ExecutiveTemplate data={data} /> : null}
    </div>
  );
}
