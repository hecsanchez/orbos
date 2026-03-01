# Orbos — Agent Guide

Full system spec is in `context.md` at the root. Read it before writing any code.

## Monorepo Structure

```
orbos/
├── apps/
│   ├── api/        ← Node.js + TypeScript (Hono). NX-managed.
│   ├── ipad/       ← Expo (React Native + TypeScript). NX-managed.
│   ├── parent/     ← Next.js. NX-managed.
│   └── studio/     ← Next.js. NX-managed.
├── seeds/          ← SEP source data. Never modify these files.
│   ├── sep_standards.json
│   └── sep_parsing_report.md
└── context.md      ← Full architecture spec. Read this first.
```

## Non-Negotiables

- Never use `npm install` or `yarn` — always use `pnpm`
- Never use Jest — all unit tests use Vitest
- All LLM calls go through `LLMClient` — never call Anthropic or OpenAI SDKs directly
- Safety Agent runs on every generated script and phenomenon proposal — no exceptions
- Never build an in-app phenomenon renderer — phenomena are facilitated externally, iPad captures evidence only
- All DB queries must be scoped by `student_id`
- Prompt strings are never hardcoded — stored as versioned templates in DB

## Stack Decisions

| | |
|---|---|
| **Package manager** | pnpm (not npm or yarn) |
| **API framework** | NestJS |
| **ORM** | Drizzle |
| **API deploy** | Railway or Render (not Cloudflare Workers) |
| **Testing (web)** | Playwright (not Cypress) |
| **Testing (api + packages)** | Vitest (not Jest) |
| **Testing (ipad)** | Detox |
| **Embeddings** | OpenAI embeddings API |
| **Object storage** | Cloudflare R2 (S3-compatible) |
| **Web deploy** | Vercel |

## Curriculum Data

SEP standards follow the ID format: `SEP-[SUBJECT]-[GRADE]-[UNIT].[STANDARD]`
Subject codes: `Matematicas`, `Espanol`, `Ciencias`
Source files are in `seeds/` — treat as read-only.

## Flagging Blockers

If something is blocked, stop and write:
```
BLOCKER: [what is blocked]
NEEDS: [what is required to unblock]
```
Never silently work around a blocker.
