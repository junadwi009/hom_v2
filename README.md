# HOM Studio OS v2 - Codex Implementation Pack

Generated: 2026-05-25

This folder contains the planning and execution documents for rebuilding HOM-style clinical studio software into a cleaner, safer, AI-assisted operating system.

The intended reader is a solo developer using Codex Code. The language is practical and beginner-friendly, but the architecture is production-oriented.

## Important Warning

Do not start by coding the dashboard. Start by reading the documents in order and creating the project foundation. A beautiful dashboard is useless if the appointment, finance, clinical notes, AI governance, and database rules are wrong.

## Recommended Reading Order

1. `00_MASTER_CONTEXT_FOR_CODEX.md`
2. `01_PRD.md`
3. `02_SYSTEM_BLUEPRINT.md`
4. `03_ARCHITECTURE_DECISIONS.md`
5. `04_DATABASE_SCHEMA.md`
6. `05_API_CONTRACTS.md`
7. `06_AI_KNOWLEDGE_STUDIO.md`
8. `07_WORKER_QUEUE_AND_AUTOMATION.md`
9. `08_FRONTEND_UI_UX_GUIDE.md`
10. `09_DEPLOYMENT_PHASES.md`
11. `10_SECURITY_AND_GOVERNANCE.md`
12. `11_TESTING_AND_QUALITY_GATES.md`
13. `12_STEP_BY_STEP_EXECUTION_PLAN.md`
14. `13_CODEX_TASK_PROMPTS.md`

## What This System Is

This is not only a booking platform. It is a clinical studio operating system with:

- Client and practitioner management
- Appointment and reschedule workflow
- Clinical case registry
- Session notes with lock/unlock approval
- Finance, commissions, reimbursements, and reports
- WhatsApp live chat and campaign approvals
- AI Business Agent
- Knowledge Studio for owner-uploaded documents
- Customer behavior intelligence from chat interactions

## Final Architecture Decision

Use:

```text
AI-native Modular Monolith
+ Selective Hexagonal Architecture
+ Code-first Worker/Queue
+ Multi-LLM Gateway
+ RAG Knowledge Layer
+ Human-in-the-loop Governance
```

Do not use:

```text
Microservices at MVP stage
n8n as the core brain
LLM as autonomous decision maker
Big-bang rewrite without migration plan
```

## Folder Structure Target

```text
hom-studio-os/
  apps/
    web/
    worker/
  packages/
    domain/
    db/
    ui/
    ai/
    config/
  docs/
  tests/
```

## First Codex Instruction

Open `13_CODEX_TASK_PROMPTS.md` and start with Prompt 01 only. Do not ask Codex to build the whole app in one run.

## Update - Code-First UI Strategy

The project can proceed without Figma. Use the current HOM screenshots as reference, then build a cleaner code-first design system in the repository.

Read these new files before frontend work:

1. `docs/15_CODE_FIRST_UI_STRATEGY.md`
2. `docs/16_USER_JOURNEY_MAPS.md`
3. `docs/17_SCREEN_SPECIFICATIONS.md`
4. `docs/18_DESIGN_SYSTEM_WITHOUT_FIGMA.md`
5. `docs/19_CODE_FIRST_UI_CODEX_PROMPTS.md`

Figma/UIPro can be added later, but they are not required for the MVP.

## Latest Robust Stack Decision

The current final implementation strategy is:

```text
Next.js + React + TypeScript core app
Supabase/Postgres as source of truth
Render backend/worker
Vercel frontend
AI Gateway for all model calls
Code-first UI design system
Optional FastAPI worker later for heavy document/AI processing
No Flask as main backend
```

Read these new files before asking Codex to code:

```text
docs/20_ROBUST_STACK_DECISION.md
docs/21_OPTIONAL_PYTHON_SERVICE_STRATEGY.md
docs/22_UPDATED_ROBUST_EXECUTION_ORDER.md
docs/23_CODEX_RULES_ROBUST_STACK.md
docs/24_TECH_STACK_LOCKFILE.md
```
