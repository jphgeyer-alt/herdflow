# HerdFlow Agent Instructions

## Scope

This workspace contains multiple product surfaces. Treat them as separate unless the task explicitly crosses boundaries.

- Root app: cattle management + offline client + Express JSON backends.
- `herdflow-web/`: standalone website for ecommerce storefront and live auction only.
- Do not mix cattle operations features into the website scope.
- Store inventory and auction inventory are separate by design; never assume a shared stock pool.

## First Places To Check

Use these docs instead of re-deriving project rules:

- [README.md](README.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- [KILO_CLINE_EXECUTION_PLAYBOOK.md](KILO_CLINE_EXECUTION_PLAYBOOK.md)
- [KILO_CLINE_MASTER_RUN_ORDER.md](KILO_CLINE_MASTER_RUN_ORDER.md)
- [herdflow-web/README.md](herdflow-web/README.md)

## Commands

Use the smallest command that validates the slice you touched.

- Root app: `npm run dev:preflight`, `npm run dev`, `npm run dev:client`, `npm run dev:server:website`, `npm run dev:server:app`, `npm run expo:start`
- Website app: `npm run dev`, `npm run lint`, `npm run test`, `npm run build`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:studio`

## Working Rules

- Preserve the split-backend architecture in the root app; update the website and app backends separately when needed.
- In `herdflow-web/`, keep changes aligned with Next.js App Router, Prisma, and the existing app/admin/auction route structure.
- Prefer linked documentation over duplicating long explanations in new instructions.
- Keep edits minimal and localized; avoid unrelated cleanup.
- Do not add dependencies or change deployment assumptions unless the task requires it.

## Validation

- For root app changes, prefer a narrow run or build command that exercises the touched area.
- For `herdflow-web/` changes, run at least `npm run lint`, then `npm run test` or `npm run build` when relevant.
- Regenerate Prisma client after schema changes.

## Kilo / Cline Workflow

When working in phased agent workflows, follow the KILO and CLINE playbooks rather than inventing a new sequence. Use the documented phase order and validation gates in the linked guides.