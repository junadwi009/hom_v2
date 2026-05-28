# QUICKSTART_FOR_BEGINNERS

## What You Should Do First

1. Read `README.md`.
2. Read `docs/00_MASTER_CONTEXT_FOR_CODEX.md`.
3. Read `docs/12_STEP_BY_STEP_EXECUTION_PLAN.md`.
4. Open Codex Code.
5. Paste only Prompt 01 from `docs/13_CODEX_TASK_PROMPTS.md`.
6. Wait for Codex to finish.
7. Review changed files.
8. Run tests.
9. Commit.
10. Continue to Prompt 02.

## What You Should Not Do

- Do not ask Codex to build the whole app in one command.
- Do not start from dashboard animations.
- Do not connect real WhatsApp/AI/payment keys before core tests pass.
- Do not migrate real data until staging import is validated.
- Do not let AI modify finance, clinical notes, refunds, or payroll.

## Simple Mental Model

Think of the system like a studio control room:

- Appointments are the daily schedule.
- Clients are the people coming to the studio.
- Practitioners are the team.
- Clinical cases are sensitive client journeys.
- Finance is the money truth.
- WhatsApp is the communication channel.
- Knowledge Studio is the owner's AI brain editor.
- Workers are the background assistants.
- AI helps, but humans approve sensitive decisions.

## If You Do Not Have Figma

That is acceptable. Start with code-first UI:

1. Build tokens and app shell.
2. Build reusable components.
3. Build mock pages using the screenshots as visual reference.
4. Add Storybook/demo states.
5. Add Playwright checks.
6. Connect backend after UI states are stable.

Use `docs/19_CODE_FIRST_UI_CODEX_PROMPTS.md` for step-by-step Codex prompts.

## Important Stack Clarification

Do not ask Codex to create a Flask backend for this project.

Use this instead:

```text
Next.js + TypeScript for the main product
Supabase for database/auth/storage/vector
Render worker for background jobs
FastAPI only later if Python document/AI processing is truly needed
```

Beginner rule: fewer stacks means fewer things to debug.
