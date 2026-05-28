# Open Questions

Date: 2026-05-25

These questions should be answered before or during Phase 1 planning. They are not blockers for reading the repository, but they matter before implementation choices become expensive.

## Repository and Tooling

1. Should the project use pnpm workspaces as the default package manager?
2. Should Git be initialized in this folder, or is this workspace copied from another repository that already has Git elsewhere?
3. Should the root folder remain named `hom_v2`, or should the scaffold assume the product name `hom-studio-os`?
4. Should we create filename aliases such as `docs/PRD.md` that point to the numbered docs, or keep the numbered docs as the only canonical files?
5. Should lint/format use ESLint plus Prettier, Biome, or the default Next.js ESLint setup first?

## Frontend Phase 1

6. Should Phase 1 use the current Next.js default React version, or should React 19 be explicitly pinned?
7. Should Storybook be installed immediately during Phase 1, or after the first components exist?
8. Which shadcn/ui style should be used at init time: neutral, zinc, stone, or another base?
9. Should the first visible route be `/dashboard/executive-command`, or should `/` redirect there later?
10. Should the Phase 1 sidebar include all planned modules immediately, or only the modules listed in the Phase 1 prompt?
11. Are there official HOM logo, typeface, and brand assets, or should Phase 1 use a text logo and tokens derived from screenshots?
12. Should screenshots be mapped to specific screens in a new reference document before UI work starts?

## Auth and Permissions

13. What should the auth placeholder display for the default mock user: Studio Director, Admin, Practitioner, or another role?
14. Should Supabase Auth be introduced in Phase 2, or should Phase 1 include only visual placeholders?
15. Should role names exactly match `docs/10_SECURITY_AND_GOVERNANCE.md`, or are there real studio role names that should replace them?

## Backend and Data

16. Does a Supabase project already exist, or should Phase 2 plan local Supabase first?
17. Which region should be used for Supabase and Render when production eventually starts: Singapore if available?
18. Should the first real backend phase use Next.js route handlers only, or also create a separate Render API service skeleton?
19. Should the first queue implementation be pure `event_outbox` polling before adding pg-boss?
20. Which knowledge source statuses should become canonical: `review_required` or `review_needed`, and should `extracted`, `approved`, and `embedded` be separate statuses?
21. Should `can_view_whatsapp_inbox` be added to the permission list before WhatsApp work begins?

## Safety and Product Policy

22. Are there any local clinical/legal disclaimers HOM already uses for pain, injury, post-surgery, pregnancy, or medical escalation messages?
23. Which finance actions require two-person approval, if any?
24. Who is allowed to publish Knowledge Studio versions?
25. Should AI auto-reply be disabled by default until the owner explicitly enables it?
26. What data must never be sent to an LLM, even after masking?

## Deployment and Services

27. Should Sentry, Langfuse, and PostHog be added as placeholders only in early phases, or deferred until production readiness?
28. Which WhatsApp provider is expected later?
29. Should Vercel and Render config files be added before actual deployment, or only documented until Phase 13?
30. Is there a budget ceiling for monthly hosting and AI usage during MVP?
