"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/job/StarRating";
import {
  type JobAnalysis,
  type JobRequirement,
  type RequirementCategory,
  type UserLevel,
  requirementCategorySchema,
} from "@/lib/job/schema";
import { createRequirementsFromAnalysis } from "@/lib/job/to-requirements";
import {
  JOB_ANALYSIS_KEY,
  REQUIREMENTS_KEY,
  readJobAnalysis,
  readRequirements,
  writeJson,
} from "@/lib/workflow/storage";

const categories = requirementCategorySchema.options;

function createManualRequirement(index: number): JobRequirement {
  return {
    id: `manual-${Date.now()}-${index}`,
    name: "",
    category: "other",
    importance: "required",
    detectedFromOffer: false,
    userLevel: 0,
    evidence: [],
  };
}

export function RequirementMatrix() {
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [requirements, setRequirements] = useState<JobRequirement[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedAnalysis = readJobAnalysis();
    const storedRequirements = readRequirements();
    setAnalysis(storedAnalysis);

    if (storedRequirements.length > 0) {
      setRequirements(storedRequirements);
      return;
    }

    if (storedAnalysis) {
      const generated = createRequirementsFromAnalysis(storedAnalysis);
      setRequirements(generated);
      writeJson(REQUIREMENTS_KEY, generated);
    }
  }, []);

  const validRequirements = useMemo(
    () => requirements.filter((requirement) => requirement.name.trim()),
    [requirements],
  );

  const updateRequirement = (
    id: string,
    updater: (requirement: JobRequirement) => JobRequirement,
  ) => {
    setSaved(false);
    setRequirements((current) =>
      current.map((requirement) =>
        requirement.id === id ? updater(requirement) : requirement,
      ),
    );
  };

  const save = () => {
    const next = validRequirements;
    writeJson(REQUIREMENTS_KEY, next);
    if (analysis) {
      writeJson(JOB_ANALYSIS_KEY, analysis);
    }
    setRequirements(next);
    setSaved(true);
  };

  if (!analysis) {
    return (
      <div className="rounded-md border bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950">
          No hay oferta analizada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vuelve al paso anterior para generar los requerimientos.
        </p>
        <Button asChild className="mt-5">
          <Link href="/analyze-job">Analizar oferta</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-md border bg-white p-4 shadow-sm md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{analysis.roleTitle}</p>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Requerimientos detectados
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setRequirements((current) => [
                ...current,
                createManualRequirement(current.length + 1),
              ])
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Agregar
          </Button>
          <Button type="button" onClick={save}>
            <Save className="size-4" aria-hidden="true" />
            Guardar
          </Button>
          <Button asChild variant="outline">
            <Link href="/match-report" onClick={save}>
              Score
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <th className="border-b px-2 py-3">Requerimiento</th>
              <th className="border-b px-2 py-3">Categoria</th>
              <th className="border-b px-2 py-3">Importancia</th>
              <th className="border-b px-2 py-3">Nivel</th>
              <th className="border-b px-2 py-3">Evidencia opcional</th>
              <th className="border-b px-2 py-3">Origen</th>
              <th className="border-b px-2 py-3 text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((requirement) => (
              <tr key={requirement.id} className="align-top">
                <td className="border-b px-2 py-3">
                  <Input
                    value={requirement.name}
                    onChange={(event) =>
                      updateRequirement(requirement.id, (item) => ({
                        ...item,
                        name: event.target.value,
                      }))
                    }
                  />
                </td>
                <td className="border-b px-2 py-3">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={requirement.category}
                    onChange={(event) =>
                      updateRequirement(requirement.id, (item) => ({
                        ...item,
                        category: event.target.value as RequirementCategory,
                      }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-b px-2 py-3">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={requirement.importance}
                    onChange={(event) =>
                      updateRequirement(requirement.id, (item) => ({
                        ...item,
                        importance: event.target.value as JobRequirement["importance"],
                      }))
                    }
                  >
                    <option value="required">Obligatorio</option>
                    <option value="nice_to_have">Deseable</option>
                  </select>
                </td>
                <td className="border-b px-2 py-3">
                  <StarRating
                    value={requirement.userLevel}
                    onChange={(value: UserLevel) =>
                      updateRequirement(requirement.id, (item) => ({
                        ...item,
                        userLevel: value,
                      }))
                    }
                  />
                </td>
                <td className="border-b px-2 py-3">
                  <Textarea
                    className="min-h-20"
                    value={(requirement.evidence ?? []).join("\n")}
                    placeholder={`Ej: Mejore un 40% el flujo usando ${requirement.name || "esta tecnologia"}...`}
                    onChange={(event) =>
                      updateRequirement(requirement.id, (item) => ({
                        ...item,
                        evidence: event.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Opcional: cuenta una experiencia real con esta tecnologia.
                  </p>
                </td>
                <td className="border-b px-2 py-3 text-muted-foreground">
                  {requirement.detectedFromOffer ? "IA" : "Manual"}
                </td>
                <td className="border-b px-2 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar requerimiento"
                    title="Eliminar requerimiento"
                    onClick={() =>
                      setRequirements((current) =>
                        current.filter((item) => item.id !== requirement.id),
                      )
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {validRequirements.length} requerimientos listos
          {saved ? " · guardado" : ""}
        </p>
        <Button asChild>
          <Link href="/match-report" onClick={save}>
            Continuar al score
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
