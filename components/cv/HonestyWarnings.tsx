import { ShieldAlert } from "lucide-react";

export function HonestyWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="size-4" aria-hidden="true" />
        <h2 className="font-semibold">Advertencias de honestidad</h2>
      </div>
      <ul className="space-y-2 text-sm leading-6">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}
