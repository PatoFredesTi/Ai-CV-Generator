# AI LaTeX CV Studio

AI LaTeX CV Studio es una aplicacion fullstack construida con Next.js, TypeScript, OpenAI, Zod y LaTeX para crear CVs profesionales adaptados a ofertas laborales especificas.

La plataforma analiza una oferta de trabajo, extrae requerimientos, permite calificar el dominio real de cada tecnologia, calcula un score de compatibilidad de 1 a 100, entrega recomendaciones accionables y genera un CV optimizado en formato `.tex`, con PDF fallback mediante React-PDF.

## Features

- Creacion de CV con IA y fallback demo sin `OPENAI_API_KEY`.
- Campo de GitHub dentro de los datos del candidato.
- Redaccion asistida de experiencia raw con modo rapido/profesional, cache local y fallback demo.
- Analisis de oferta laboral en `/analyze-job`.
- Extraccion de skills obligatorias, deseables, stack, responsabilidades y keywords ATS.
- Matriz editable de requerimientos con escala de 0 a 5 estrellas.
- Evidencia opcional por tecnologia o requisito para respaldar el nivel declarado.
- Score de compatibilidad 1-100 con desglose por categoria.
- Reporte de fortalezas, debilidades, brechas y recomendaciones.
- Adaptacion honesta del CV segun oferta y nivel declarado.
- Mejora de bullets de experiencia segun requisitos de la oferta, sin inventar evidencia.
- Pantalla `/extras` para agregar proyectos, idiomas, certificaciones, referencias, voluntariados, ayudantias u otras secciones.
- Ciclo de reevaluacion en `/review-loop` con auditoria de reclutador, reescritura X/Y/Z, escaneo ATS, revision de estilo ATS friendly y reevaluacion final.
- Seis templates visuales para el CV: Classic, Modern, Minimal, ATS, Developer y Executive.
- Generacion de LaTeX con templates `ATS Modern`, `Classic Developer` y `Compact Senior`.
- Descarga de `.tex` y PDF fallback.
- Validacion con Zod y tests unitarios para logica critica.

## Stack Tecnico

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind CSS + componentes UI locales estilo shadcn/ui
- Zod + React Hook Form
- OpenAI API con modo demo
- React-PDF para exportacion PDF fallback
- Vitest + Testing Library
- Upstash Redis opcional para rate limiting

## Flujo Principal

1. `/create`: crear el CV base.
2. `/analyze-job`: pegar y analizar una oferta laboral.
3. `/requirements`: revisar requerimientos y declarar dominio real.
4. `/match-report`: calcular score y recomendaciones.
5. `/adapted-cv`: generar una version adaptada del CV.
6. `/extras`: agregar proyectos, idiomas y secciones adicionales opcionales.
7. `/review-loop`: iterar mejoras con auditoria, X/Y/Z, ATS, estilo ATS friendly y score final.
8. `/preview`: generar, copiar y descargar LaTeX.
9. `/api/generate-pdf`: descargar PDF fallback.

El estado temporal del flujo nuevo se guarda en `localStorage`, por lo que se puede probar sin login ni base de datos.

## Arquitectura

```txt
app/
  api/
    analyze-job/
    improve-experience/
    review-loop/
    score-cv/
    optimize-cv/
    generate-latex/
    generate-pdf/
  analyze-job/
  requirements/
  match-report/
  adapted-cv/
  extras/
  preview/

components/
  cv/
  job/
  latex/
  review/
  scoring/
  ui/

lib/
  ai/
  cv/
  job/
  latex/
  scoring/
  workflow/
```

## Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EXPERIENCE_MODEL_FAST=
OPENAI_EXPERIENCE_MODEL_POLISH=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sin `OPENAI_API_KEY`, el analisis de oferta, la creacion de CV, la redaccion de experiencia y la adaptacion funcionan con datos demo controlados.

`OPENAI_EXPERIENCE_MODEL_FAST` y `OPENAI_EXPERIENCE_MODEL_POLISH` permiten usar modelos distintos solo para el campo de experiencia. Si quedan vacios, el sistema usa `OPENAI_MODEL`. El formulario tambien cachea cada mejora en `localStorage` para evitar llamadas repetidas con el mismo texto y modo.

## Scripts

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run test
```

En PowerShell, `npm.cmd` evita problemas con el shim `npm.ps1` si la execution policy esta restringida.

## Principios Eticos

- No inventar experiencia, empresas, cargos ni certificaciones.
- No aumentar artificialmente el nivel declarado por el usuario.
- No presentar como fortaleza una tecnologia marcada con bajo dominio.
- No incluir skills con nivel 0 en el CV adaptado.
- Mostrar brechas y warnings de forma explicita.
- Ayudar a postular de forma mas estrategica, no a mentir.

## Roadmap

- Compilacion real de LaTeX a PDF.
- Persistencia con usuarios e historial.
- Comparacion entre multiples ofertas.
- Carta de presentacion.
- Exportacion DOCX.
- Integracion con GitHub o LinkedIn para evidencia real.
