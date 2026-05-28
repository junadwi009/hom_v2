# Codex Prompt — Phase 0 Repository Foundation

Implement only Phase 0.

Goal: create a clean repository foundation for HOM Studio OS v2 without implementing business modules yet.

Read:
- `START_HERE_FINAL.md`
- `docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md`
- `docs/23_CODEX_RULES_ROBUST_STACK.md`
- `docs/24_TECH_STACK_LOCKFILE.md`

Tasks:

1. Initialize or verify monorepo structure.
2. Create `apps/web` for Next.js app.
3. Create `apps/worker` placeholder only; do not implement jobs yet.
4. Create `packages/ui`, `packages/domain`, `packages/db`, `packages/config` placeholders.
5. Add TypeScript strict configuration.
6. Add Biome or equivalent lint/format config.
7. Add `.env.example` with safe placeholder variables only.
8. Add README instructions for local setup.
9. Add basic CI workflow skeleton.
10. Do not connect external paid APIs.
11. Do not implement Supabase migrations yet unless requested.

Constraints:

- Do not add Flask.
- Do not add FastAPI.
- Do not add n8n.
- Do not add microservices.
- Do not add production deployment.
- Do not hardcode secrets.

Return summary, changed files, checks run, and next step.
