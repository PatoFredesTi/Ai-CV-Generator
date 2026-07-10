"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Briefcase, GraduationCap, Loader2, Plus, Sparkles, Trash2, UserRound } from "lucide-react";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { generateCvContent } from "@/app/create/actions";
import { CvPreview } from "@/components/templates/cv-preview";
import { TemplatePicker } from "@/components/templates/template-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { demoInput } from "@/lib/cv/demo";
import { type CVData, type CVInputFormValues, cvInputSchema } from "@/lib/cv/schema";
import { createFallbackGeneratedContent, buildCvFromInput } from "@/lib/cv/transform";
import { cn } from "@/lib/utils";

const emptyValues: CVInputFormValues = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
    github: "",
    website: "",
  },
  targetRole: "",
  language: "es",
  tone: "technical",
  template: "modern",
  experience: [
    {
      company: "",
      role: "",
      startDate: "",
      endDate: "Presente",
      rawDescription: "",
    },
  ],
  education: [
    {
      institution: "",
      degree: "",
      year: "",
    },
  ],
  rawSkills: "",
};

const steps = [
  { title: "Perfil", icon: UserRound },
  { title: "Experiencia", icon: Briefcase },
  { title: "Educación", icon: GraduationCap },
  { title: "Generar", icon: Sparkles },
];

const HISTORY_KEY = "cv-history";
const COUNT_KEY = "cv-generated-count";
const EXPERIENCE_IMPROVE_CACHE_PREFIX = "cv-experience-improve-v2";

type ImproveMode = "fast" | "polish";

type ImproveExperienceApiResult = {
  improvedDescription: string;
  warnings?: string[];
  provider?: "openai" | "demo";
  model?: string;
  mode?: ImproveMode;
};

function splitKeywords(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function hashString(value: string) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(36);
}

function createImproveCacheKey(payload: unknown) {
  return `${EXPERIENCE_IMPROVE_CACHE_PREFIX}:${hashString(
    JSON.stringify(payload),
  )}`;
}

function persistCv(cv: CVData) {
  const current = window.localStorage.getItem(HISTORY_KEY);
  const history = current ? (JSON.parse(current) as CVData[]) : [];
  const next = [cv, ...history.filter((item) => item.id !== cv.id)].slice(0, 8);

  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));

  const count = Number(window.localStorage.getItem(COUNT_KEY));
  window.localStorage.setItem(
    COUNT_KEY,
    String(Number.isFinite(count) && count > 0 ? count + 1 : 129),
  );
  window.dispatchEvent(new Event("cv-generated"));
}

function fieldError(message?: string) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function CreateCvForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [provider, setProvider] = useState<"openai" | "demo" | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CVInputFormValues>({
    resolver: zodResolver(cvInputSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });

  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = form;
  const [improvingIndex, setImprovingIndex] = useState<number | null>(null);
  const [improveMode, setImproveMode] = useState<ImproveMode>("fast");
  const [experienceImproveWarnings, setExperienceImproveWarnings] = useState<
    Record<number, string[]>
  >({});
  const [experienceImproveMeta, setExperienceImproveMeta] = useState<
    Record<number, string>
  >({});

  const experienceFields = useFieldArray({
    control,
    name: "experience",
  });

  const educationFields = useFieldArray({
    control,
    name: "education",
  });

  const watchedValues = watch();
  const draftCv = useMemo(() => {
    const parsed = cvInputSchema.safeParse(watchedValues);

    if (!parsed.success) {
      return null;
    }

    return buildCvFromInput(parsed.data, createFallbackGeneratedContent(parsed.data), {
      id: "draft",
      createdAt: "2026-04-01T00:00:00.000Z",
    });
  }, [watchedValues]);

  const stepFields = (targetStep: number): FieldPath<CVInputFormValues>[] => {
    if (targetStep === 0) {
      return [
        "personal.fullName",
        "personal.email",
        "personal.phone",
        "personal.location",
        "targetRole",
        "template",
      ];
    }

    if (targetStep === 1) {
      return form
        .getValues("experience")
        .flatMap((_, index) => [
          `experience.${index}.company`,
          `experience.${index}.role`,
          `experience.${index}.startDate`,
          `experience.${index}.endDate`,
          `experience.${index}.rawDescription`,
        ]) as FieldPath<CVInputFormValues>[];
    }

    if (targetStep === 2) {
      return [
        "rawSkills",
        ...form
          .getValues("education")
          .flatMap((_, index) => [
            `education.${index}.institution`,
            `education.${index}.degree`,
            `education.${index}.year`,
          ]),
      ] as FieldPath<CVInputFormValues>[];
    }

    return [];
  };

  const goNext = async () => {
    const isValid = await form.trigger(stepFields(step));

    if (!isValid) {
      return;
    }

    setFormError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setFormError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  const loadDemo = () => {
    form.reset(demoInput);
    setProvider(null);
    setFormError(null);
    setStep(3);
  };

  const applyImprovedExperience = (
    index: number,
    payload: ImproveExperienceApiResult,
    source: string,
  ) => {
    setValue(
      `experience.${index}.rawDescription`,
      payload.improvedDescription,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    setExperienceImproveWarnings((current) => ({
      ...current,
      [index]: payload.warnings ?? [],
    }));
    setExperienceImproveMeta((current) => ({
      ...current,
      [index]: source,
    }));
  };

  const improveExperience = async (index: number) => {
    const experience = getValues(`experience.${index}`);
    const rawDescription = experience.rawDescription.trim();

    if (rawDescription.length < 8) {
      setFormError("Agrega una nota breve antes de mejorar la redaccion.");
      return;
    }

    setFormError(null);
    setImprovingIndex(index);

    try {
      const requestPayload = {
        rawDescription,
        role: experience.role,
        company: experience.company,
        targetRole: getValues("targetRole"),
        language: getValues("language"),
        mode: improveMode,
        targetKeywords: splitKeywords(getValues("rawSkills") ?? ""),
      };
      const cacheKey = createImproveCacheKey(requestPayload);
      const cachedValue = window.localStorage.getItem(cacheKey);

      if (cachedValue) {
        try {
          const cachedPayload = JSON.parse(
            cachedValue,
          ) as ImproveExperienceApiResult;

          applyImprovedExperience(index, cachedPayload, "Cache local");
          return;
        } catch {
          window.localStorage.removeItem(cacheKey);
        }
      }

      const response = await fetch("/api/improve-experience", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFormError(payload?.message ?? "No se pudo mejorar la experiencia.");
        return;
      }

      const source =
        payload.provider === "openai"
          ? `OpenAI${payload.model ? ` · ${payload.model}` : ""}`
          : "Demo";

      try {
        window.localStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch {
        // Cache is only a cost optimization; the rewrite should still apply.
      }
      applyImprovedExperience(index, payload, source);
    } catch {
      setFormError("No se pudo mejorar la experiencia.");
    } finally {
      setImprovingIndex(null);
    }
  };

  const submit = async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      setFormError("Hay campos pendientes antes de generar el CV.");
      return;
    }

    setFormError(null);
    const payload = form.getValues();

    startTransition(async () => {
      const result = await generateCvContent(payload);

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setProvider(result.provider);
      persistCv(result.cv);
      router.push(`/preview/${result.cv.id}`);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)]">
      <form
        className="rounded-md border bg-white p-4 shadow-sm md:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Nuevo CV</p>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
              Datos del candidato
            </h1>
          </div>
          <Button type="button" variant="outline" onClick={loadDemo}>
            <Sparkles className="size-4" aria-hidden="true" />
            Cargar demo
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-2">
          {steps.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors",
                  index === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-white text-muted-foreground hover:bg-muted",
                )}
                onClick={async () => {
                  if (index <= step) {
                    setStep(index);
                    return;
                  }

                  const isValid = await form.trigger(stepFields(step));
                  if (isValid) {
                    setStep(index);
                  }
                }}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {step === 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre completo" error={errors.personal?.fullName?.message}>
              <Input placeholder="Patricio Herrera" {...register("personal.fullName")} />
            </Field>
            <Field label="Cargo objetivo" error={errors.targetRole?.message}>
              <Input placeholder="Frontend Developer" {...register("targetRole")} />
            </Field>
            <Field label="Email" error={errors.personal?.email?.message}>
              <Input type="email" placeholder="patricio@email.com" {...register("personal.email")} />
            </Field>
            <Field label="Teléfono" error={errors.personal?.phone?.message}>
              <Input placeholder="+56 9 1234 5678" {...register("personal.phone")} />
            </Field>
            <Field label="Ubicación" error={errors.personal?.location?.message}>
              <Input placeholder="Santiago, Chile" {...register("personal.location")} />
            </Field>
            <Field label="LinkedIn">
              <Input placeholder="linkedin.com/in/patricio" {...register("personal.linkedIn")} />
            </Field>
            <Field label="GitHub">
              <Input placeholder="github.com/patricio" {...register("personal.github")} />
            </Field>
            <Field label="Sitio web">
              <Input placeholder="patricio.dev" {...register("personal.website")} />
            </Field>
            <Field label="Idioma">
              <select
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("language")}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <TemplatePicker
                value={watchedValues.template ?? "modern"}
                onChange={(template) => setValue("template", template)}
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            {experienceFields.fields.map((field, index) => (
              <section key={field.id} className="rounded-md border bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Experiencia {index + 1}
                  </h2>
                  {experienceFields.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar experiencia"
                      title="Eliminar experiencia"
                      onClick={() => experienceFields.remove(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Empresa"
                    error={errors.experience?.[index]?.company?.message}
                  >
                    <Input {...register(`experience.${index}.company`)} />
                  </Field>
                  <Field label="Rol" error={errors.experience?.[index]?.role?.message}>
                    <Input {...register(`experience.${index}.role`)} />
                  </Field>
                  <Field
                    label="Inicio"
                    error={errors.experience?.[index]?.startDate?.message}
                  >
                    <Input placeholder="2022" {...register(`experience.${index}.startDate`)} />
                  </Field>
                  <Field label="Fin" error={errors.experience?.[index]?.endDate?.message}>
                    <Input placeholder="Presente" {...register(`experience.${index}.endDate`)} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field
                      label="Experiencia raw"
                      error={errors.experience?.[index]?.rawDescription?.message}
                    >
                      <Textarea
                        placeholder="Notas breves: hice dashboard en React, conecte APIs, mejore carga, trabaje con producto..."
                        {...register(`experience.${index}.rawDescription`)}
                      />
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div
                          className="inline-flex w-fit rounded-md border bg-white p-1"
                          role="group"
                          aria-label="Modo de redaccion"
                        >
                          {(["fast", "polish"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              aria-pressed={improveMode === mode}
                              title={
                                mode === "fast"
                                  ? "Redaccion rapida"
                                  : "Pulido profesional"
                              }
                              className={cn(
                                "h-8 rounded px-3 text-xs font-medium transition-colors",
                                improveMode === mode
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                              onClick={() => setImproveMode(mode)}
                            >
                              {mode === "fast" ? "Rapido" : "Pulir"}
                            </button>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void improveExperience(index)}
                          disabled={improvingIndex === index}
                        >
                          {improvingIndex === index ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Sparkles className="size-4" aria-hidden="true" />
                          )}
                          Redactar con IA
                        </Button>
                      </div>
                      {experienceImproveMeta[index] ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {experienceImproveMeta[index]}
                        </p>
                      ) : null}
                      {experienceImproveWarnings[index]?.length ? (
                        <div className="mt-2 space-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          {experienceImproveWarnings[index].map((warning) => (
                            <p key={warning}>{warning}</p>
                          ))}
                        </div>
                      ) : null}
                    </Field>
                  </div>
                </div>
              </section>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                experienceFields.append({
                  company: "",
                  role: "",
                  startDate: "",
                  endDate: "Presente",
                  rawDescription: "",
                })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar experiencia
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            {educationFields.fields.map((field, index) => (
              <section key={field.id} className="rounded-md border bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Educación {index + 1}
                  </h2>
                  {educationFields.fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar educación"
                      title="Eliminar educación"
                      onClick={() => educationFields.remove(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Institución"
                    error={errors.education?.[index]?.institution?.message}
                  >
                    <Input {...register(`education.${index}.institution`)} />
                  </Field>
                  <Field label="Título" error={errors.education?.[index]?.degree?.message}>
                    <Input {...register(`education.${index}.degree`)} />
                  </Field>
                  <Field label="Año" error={errors.education?.[index]?.year?.message}>
                    <Input {...register(`education.${index}.year`)} />
                  </Field>
                </div>
              </section>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                educationFields.append({
                  institution: "",
                  degree: "",
                  year: "",
                })
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar educación
            </Button>
            <Field label="Habilidades" error={errors.rawSkills?.message}>
              <Textarea
                placeholder="React, TypeScript, Next.js, testing, comunicación..."
                {...register("rawSkills")}
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rounded-md border bg-slate-50 p-4">
            <Field label="Tono">
              <select
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("tone")}
              >
                <option value="technical">Técnico</option>
                <option value="executive">Ejecutivo</option>
                <option value="creative">Creativo</option>
              </select>
            </Field>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                Generar con IA
              </Button>
              {provider ? (
                <span className="text-sm text-muted-foreground">
                  Proveedor: {provider === "openai" ? "OpenAI" : "Demo"}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {formError ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
            Atrás
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Siguiente
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </form>

      <aside className="rounded-md border bg-white p-3 shadow-sm lg:sticky lg:top-4">
        {draftCv ? (
          <CvPreview data={draftCv} />
        ) : (
          <div className="flex min-h-[520px] items-center justify-center rounded-md border border-dashed bg-slate-50 p-6 text-center text-sm text-muted-foreground">
            Preview
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {fieldError(error)}
    </div>
  );
}
