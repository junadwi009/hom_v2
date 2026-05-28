# Phase 0 Repository Audit

Date: 2026-05-25

## Summary

This repository is currently a documentation and execution pack for HOM Studio OS v2. It contains product, architecture, stack, UI, security, testing, and Codex prompt documents, plus reference screenshots and PDFs.

It does not yet contain a scaffolded Next.js app, package files, TypeScript configuration, Storybook setup, Playwright setup, Supabase migrations, or worker code.

Current Phase 0 instruction is audit and planning only. No product feature implementation, dependency installation, Flask, FastAPI, n8n, VPS deployment, or production service connection was performed.

## Existing Files and Folders

Root files:

- `START_HERE_FINAL.md`
- `FINAL_COMPACT_CONTEXT.md`
- `FILE_MANIFEST.md`
- `README.md`
- `QUICKSTART_FOR_BEGINNERS.md`
- `HOM_Studio_OS_v2_PRD_and_Implementation_Roadmap.md`
- `HOM_Studio_OS_v2_Code_First_UI_Strategy_Addendum.md`
- `HOM_Studio_OS_v2_Robust_Stack_Strategy_Addendum.md`
- `AGENTS.md`
- `CONTRIBUTING.md`

Folders:

- `docs/` - numbered architecture, product, UI, security, testing, execution, and stack documents.
- `codex/` - direct Codex prompts for master execution and phases.
- `pdfs/` - PDF versions of the PRD/roadmap, code-first UI strategy, and robust stack strategy.
- `reference_screenshots/` - 10 PNG screenshots of the existing HOM interface for visual reference.

Important `docs/` files currently present:

- `00_MASTER_CONTEXT_FOR_CODEX.md`
- `01_PRD.md`
- `02_SYSTEM_BLUEPRINT.md`
- `03_ARCHITECTURE_DECISIONS.md`
- `04_DATABASE_SCHEMA.md`
- `05_API_CONTRACTS.md`
- `06_AI_KNOWLEDGE_STUDIO.md`
- `07_WORKER_QUEUE_AND_AUTOMATION.md`
- `08_FRONTEND_UI_UX_GUIDE.md`
- `09_DEPLOYMENT_PHASES.md`
- `10_SECURITY_AND_GOVERNANCE.md`
- `11_TESTING_AND_QUALITY_GATES.md`
- `12_STEP_BY_STEP_EXECUTION_PLAN.md`
- `13_CODEX_TASK_PROMPTS.md`
- `14_REFERENCES.md`
- `15_CODE_FIRST_UI_STRATEGY.md`
- `16_USER_JOURNEY_MAPS.md`
- `17_SCREEN_SPECIFICATIONS.md`
- `18_DESIGN_SYSTEM_WITHOUT_FIGMA.md`
- `19_CODE_FIRST_UI_CODEX_PROMPTS.md`
- `20_ROBUST_STACK_DECISION.md`
- `21_OPTIONAL_PYTHON_SERVICE_STRATEGY.md`
- `22_UPDATED_ROBUST_EXECUTION_ORDER.md`
- `23_CODEX_RULES_ROBUST_STACK.md`
- `24_TECH_STACK_LOCKFILE.md`
- `PHASE_0_REPO_AUDIT.md`
- `PHASE_1_IMPLEMENTATION_PLAN.md`
- `OPEN_QUESTIONS.md`

## Package and Config Inspection

No package or app scaffold files were found:

- No `package.json`
- No lockfile
- No `pnpm-workspace.yaml`
- No `tsconfig.json`
- No `next.config.*`
- No `tailwind.config.*`
- No Storybook config
- No Playwright config
- No app source directories such as `apps/web`

No `.git` directory was found in this workspace, so there is no local Git status or commit history available here.

## Missing Expected Files

The user-requested document names below do not exist under those exact names, but equivalent numbered docs exist:

- `docs/PRD.md` -> `docs/01_PRD.md`
- `docs/SYSTEM_BLUEPRINT.md` -> `docs/02_SYSTEM_BLUEPRINT.md`
- `docs/ARCHITECTURE_DECISIONS.md` -> `docs/03_ARCHITECTURE_DECISIONS.md`
- `docs/ROBUST_STACK_DECISION.md` -> `docs/20_ROBUST_STACK_DECISION.md`
- `docs/TECH_STACK_LOCKFILE.md` -> `docs/24_TECH_STACK_LOCKFILE.md`
- `docs/STEP_BY_STEP_EXECUTION_PLAN.md` -> `docs/12_STEP_BY_STEP_EXECUTION_PLAN.md`
- `docs/CODE_FIRST_UI_STRATEGY.md` -> `docs/15_CODE_FIRST_UI_STRATEGY.md`
- `docs/USER_JOURNEY_MAPS.md` -> `docs/16_USER_JOURNEY_MAPS.md`
- `docs/SCREEN_SPECIFICATIONS.md` -> `docs/17_SCREEN_SPECIFICATIONS.md`
- `docs/SECURITY_MODEL.md` -> `docs/10_SECURITY_AND_GOVERNANCE.md`
- `docs/TEST_PLAN.md` -> `docs/11_TESTING_AND_QUALITY_GATES.md`
- `docs/CODEX_RULES_ROBUST_STACK.md` -> `docs/23_CODEX_RULES_ROBUST_STACK.md`

Recommendation: keep the numbered source docs as canonical. Add aliases only if the owner wants simpler filenames.

## Document Conflicts or Tensions

1. Phase 0 scope conflict:
   - `docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md` and `codex/CODEX_PHASE_0_PROMPT.md` describe Phase 0 as repository scaffolding plus Next.js, Tailwind, Storybook, Playwright, and CI setup.
   - The current user instruction defines Phase 0 as repository understanding, safety setup, and execution planning only.
   - Resolution: the current user instruction wins. Scaffolding must wait for explicit Phase 1 approval.

2. Phase 1 naming conflict:
   - `docs/01_PRD.md` labels Phase 1 as foundation including auth, RBAC, clients, practitioners, services, appointments, audit logs, and base dashboard layout.
   - `docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md` labels Phase 1 as design system and app shell.
   - The current user instruction asks Phase 1 implementation planning for design tokens, app shell, sidebar/topbar, base layout, auth placeholder, Storybook, and frontend structure.
   - Resolution: for the next implementation phase, use the current user instruction and `docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md`.

3. Starter prompt conflict:
   - `QUICKSTART_FOR_BEGINNERS.md` says to paste Prompt 01 from `docs/13_CODEX_TASK_PROMPTS.md`.
   - `START_HERE_FINAL.md` says to give Codex `codex/CODEX_MASTER_EXECUTION_PROMPT.md`.
   - The current user instruction supplies a narrower Phase 0 task.
   - Resolution: follow the current user instruction first.

4. Permission list mismatch:
   - `docs/05_API_CONTRACTS.md` references `can_view_whatsapp_inbox`.
   - `docs/10_SECURITY_AND_GOVERNANCE.md` does not list that exact permission.
   - Recommendation: add or rename this permission before implementing WhatsApp permissions.

5. Knowledge status naming mismatch:
   - `docs/17_SCREEN_SPECIFICATIONS.md` uses statuses such as `review_required`.
   - `docs/06_AI_KNOWLEDGE_STUDIO.md` uses statuses such as `review_needed`, `extracted`, `approved`, and `embedded`.
   - Recommendation: choose one canonical enum before database migrations.

6. Queue decision needs narrowing:
   - Docs allow Postgres `event_outbox`, pg-boss, or Redis/BullMQ.
   - Lockfile says event_outbox first, pg-boss or Redis later.
   - Recommendation: Phase 1 should not add a worker queue. Later phases should start with `event_outbox`.

7. React version is implied but not fully locked:
   - Some docs mention React 19.
   - The current locked strategy says React but does not specify a version.
   - Recommendation: confirm whether to accept the current Next.js default React version during scaffolding.

## Risky or Unclear Instructions

- The current folder is not a Git repo. Commit rules can be documented, but commits cannot be made until Git is initialized.
- No package manager is confirmed. A monorepo strongly suggests pnpm, but this should be approved before scaffolding.
- The UI docs mention optional `21st.dev Agent Elements`; this should be treated as optional and reviewed before adding dependencies.
- Storybook is required by the locked strategy, but adding it during scaffolding increases setup time. Phase 1 should include it, because code-first UI needs a visible component catalog.
- Supabase is the locked platform, but no project URL, local Supabase decision, or environment naming convention has been confirmed.
- Reference screenshots exist, but there is no written mapping from screenshot file names to screen names.
- No license, ownership, or distribution policy is present.

## Recommended Next Steps

1. Get owner approval to begin Phase 1 implementation.
2. Confirm package manager. Recommended assumption: pnpm with a workspace.
3. Scaffold the monorepo and Next.js app in `apps/web`.
4. Add root guardrails: workspace package file, TypeScript strict config, lint/format setup, `.env.example`, and no-secret policy.
5. Add app shell and design tokens using mock data only.
6. Add Storybook early so components become the design source of truth.
7. Add Playwright smoke tests after the shell exists.
8. Keep backend, Supabase, AI, WhatsApp, finance, and clinical workflows as placeholders only until later phases.

## Proposed Scaffold Commands for Approval

These commands are proposed only. They were not run during Phase 0.

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm create next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

After the Next.js scaffold exists, Phase 1 can add the UI foundation:

```powershell
pnpm --dir apps/web dlx shadcn@latest init
pnpm --dir apps/web add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react motion
pnpm --dir apps/web dlx storybook@latest init
pnpm --dir apps/web dlx playwright@latest install chromium
```

Additional root monorepo files and placeholder package folders should be created in small reviewed edits after scaffold approval.
