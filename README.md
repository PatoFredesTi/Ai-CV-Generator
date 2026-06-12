# Generador de CVs con IA

MVP de portafolio basado en el BRD: Next.js 15 App Router, Tailwind CSS, componentes estilo shadcn/ui, Server Actions, OpenAI opcional, rate limiting y generación de PDF.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + componentes UI locales estilo shadcn
- Zod + React Hook Form
- OpenAI API con fallback demo
- React-PDF para exportación PDF
- Upstash Redis + rate limit serverless
- Vitest + Testing Library

## Scripts

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run test
```

En PowerShell, usar `npm.cmd` evita el bloqueo del shim `npm.ps1` cuando la execution policy está restringida.

## Variables de entorno

Copia `.env.example` a `.env.local` y configura:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Sin `OPENAI_API_KEY`, el flujo usa generación demo para poder probar formulario, preview y PDF.

## Flujo MVP

1. `/` muestra el acceso principal, contador local y preview demo.
2. `/create` captura perfil, experiencia, educación, habilidades y template.
3. La Server Action valida con Zod, aplica rate limiting y genera contenido con OpenAI o fallback.
4. `/preview/[id]` permite editar resumen, bullets, habilidades y template.
5. `/api/generate-pdf` genera el PDF desde el CV validado.
