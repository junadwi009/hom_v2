# AGENTS.md - HOM Studio OS v2

This file is the working agreement for Codex and any future coding agent in this repository.

## Project Purpose

HOM Studio OS v2 is a production-oriented rebuild of a clinical pilates/physio-informed studio operating system. It is not a generic booking app and not a Fit Hub clone.

The product goal is to help the studio owner and team safely manage appointments, clients, practitioners, clinical-adjacent notes, approvals, finance, WhatsApp operations, knowledge, AI-assisted analysis, and behavior intelligence from one auditable internal platform.

The system must stay understandable for a beginner solo developer. Build in small, reviewable steps and explain every change in beginner-friendly language.

## Locked Tech Stack

Use this stack unless the owner explicitly updates the lockfile:

- Core app: Next.js, React, TypeScript strict mode.
- UI: Tailwind CSS, shadcn/ui, Radix UI, Motion.dev.
- Component documentation and visual QA: Storybook.
- End-to-end checks: Playwright.
- Database, auth, storage, vector: Supabase, Postgres, Supabase Storage, pgvector.
- Frontend hosting: Vercel.
- Backend/API and worker hosting: Render.
- Worker and queue: TypeScript worker, Postgres `event_outbox` first, pg-boss or Redis only when justified.
- AI: centralized AI Gateway package or module.
- Architecture: AI-native Modular Monolith, Selective Hexagonal Architecture, Code-first Workflow Engine, Multi-LLM Gateway, RAG Knowledge Layer, Behavior Intelligence Layer, Human-in-the-loop Governance.

## Prohibited Technologies and Patterns

Do not introduce these in the core product:

- Flask as the main backend.
- FastAPI in Phase 1.
- n8n as core transaction logic or workflow brain.
- Microservices in early phases.
- VPS deployment in early phases.
- Kubernetes in early phases.
- Direct LLM provider calls from UI components or random feature files.
- Direct database writes from UI components for sensitive state.
- Production service connections during planning or mock UI phases.
- Hardcoded secrets, API keys, tokens, or production data.

FastAPI may be considered later only for isolated heavy document, OCR, embedding, AI evaluation, or batch processing work. It must not own core product transactions.

## Coding Rules

- Use TypeScript strict mode.
- Validate all API and server action input with Zod or an equivalent typed schema.
- Keep business rules out of React components.
- Put high-risk domain logic in server-side use cases or `packages/domain`.
- Use adapters for external services.
- All LLM calls must go through the AI Gateway.
- Do not show fake zero values when data failed to load.
- Every screen must have loading, empty, error, permission-denied where relevant, and success states.
- Use reusable components instead of one-off page-only UI when a pattern repeats.
- Use design tokens and semantic CSS variables instead of random hardcoded colors.
- Use restrained Motion.dev animation and always respect reduced-motion preferences.

## Sensitive Domain Rules

The following domains require backend validation, permission checks, and audit logs:

- Appointments and reschedules.
- Finance ledger, summaries, reimbursements, commissions, refunds, payroll-related approvals.
- Clinical cases and session notes.
- Clinical note lock, unlock, approve, and reject workflows.
- WhatsApp manual sends and blast approvals.
- Permission and role changes.
- Knowledge publish and rollback.
- AI Business Agent access to sensitive summaries.

Workers and optional future services must call approved backend/domain use cases. They must not bypass domain rules or directly mutate sensitive state.

## AI Safety Boundaries

AI may:

- Draft replies.
- Summarize conversations.
- Classify intent.
- Extract behavior signals.
- Recommend next actions.
- Analyze approved summaries.
- Suggest knowledge updates.

AI must not directly:

- Diagnose medical conditions.
- Prescribe treatment.
- Modify appointments.
- Confirm reschedules without backend availability checks.
- Modify finance.
- Approve payroll, commissions, reimbursements, refunds, or note unlocks.
- Edit finalized clinical notes.
- Send WhatsApp blasts.
- Publish knowledge.

Sensitive AI suggestions must become approval requests or drafts for a human to review.

## Safety Rules

- Do not run destructive commands.
- Do not delete files unless the user explicitly asks.
- Do not overwrite user work.
- Do not connect to production services without explicit approval.
- Do not install paid APIs or services.
- Do not commit secrets.
- Use `.env.example` for placeholders only.
- Treat Supabase service role keys as server-only secrets.
- Scrub PII, clinical note content, payment information, and secrets from logs.

## Testing Expectations

Testing should scale with risk:

- UI foundation: typecheck, lint, Storybook rendering, Playwright smoke tests.
- Business rules: unit tests for appointment overlap, permissions, finance summaries, note locking, AI policy guard, and knowledge scope filtering.
- API/database behavior: integration tests for mutations, audit logs, RLS, and permission failures.
- Critical user flows: Playwright tests for login, dashboard, appointment operations, knowledge testing, and approvals once those features exist.

Do not call a feature done until relevant checks pass or any missing checks are clearly documented.

## Documentation Expectations

- Update docs when decisions, commands, structure, or safety rules change.
- Keep docs beginner-friendly and explicit.
- Prefer small, concrete steps over broad instructions.
- Record assumptions and open questions before implementing risky choices.
- Use numbered implementation phases and do not skip ahead.

## Commit Rules

This folder currently may not be initialized as a Git repository. If Git is added later:

- Make small, reviewable commits.
- Commit only related changes together.
- Do not mix documentation, scaffold, UI, and backend feature work in one large commit.
- Use clear commit messages such as `docs: add phase 0 audit` or `ui: add app shell tokens`.
- Run the relevant checks before committing.

## Phase Discipline

Current instruction for this task: Phase 0 is documentation, repository understanding, safety setup, and execution planning only.

Do not build product features during Phase 0. Ask for approval before starting Phase 1 implementation or running scaffold commands.
