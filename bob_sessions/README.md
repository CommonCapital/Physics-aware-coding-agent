# IBM Bob 2.0 — Usage Evidence

This folder contains screenshots from the IBM Bob 2.0 sessions used to build **PhysicsReview**. Each screenshot links to the files Bob produced in that session.

## Team

| Team member | Sessions | Focus |
|---|---|---|
| Nursan Omarov | 01, 03, 04, 08 | Architecture, physics knowledge base, agent prompts, bug fixes |
| Alimzhan Tokushev | 02, 05, 06, 07, 09 | LLM layer, review pipeline, UI, database, demo example |

## Sessions

| # | Team member | What Bob helped build | Files produced |
|---|---|---|---|
| [01](session-01.png) | Nursan Omarov | Codebase analysis and product architecture: knowledge base, law mapping, test generation, PR review pipeline, multi-provider LLM layer | Architecture plan |
| [02](session-02.png) | Alimzhan Tokushev | Multi-provider LLM abstraction layer | `lib/llm/provider.ts`, `lib/llm/models.ts`, `lib/llm/catalog.ts`, `lib/llm/index.ts` |
| [03](session-03.png) | Nursan Omarov | Physics knowledge base: 14 laws with equations, SI units, validity ranges, common bugs and test templates | `lib/physics-lab/knowledge-base/laws.ts` |
| [04](session-04.png) | Nursan Omarov | Agent system prompts for the law-mapping, test-generation and review passes | `lib/physics-lab/instructions/law-mapper.ts`, `reviewer.ts`, `test-generator.ts` |
| [05](session-05.png) | Alimzhan Tokushev | Trigger.dev 3-pass review task with `generateObject` and Zod schemas | `trigger/review.ts` |
| [06](session-06.png) | Alimzhan Tokushev | Review UI components and pages | `components/review-composer.tsx`, `components/review-results.tsx`, `app/(app)/review/[id]/page.tsx` |
| [07](session-07.png) | Alimzhan Tokushev | Database schema (`review_jobs`), server actions, store and queries | `lib/db/schema.ts`, `lib/physics-lab/review-actions.ts`, `lib/physics-lab/review-store.ts` |
| [08](session-08.png) | Nursan Omarov | Bug fixes: `generateObject` migration, line numbers in prompts, auto-refresh, physics constant correction | `trigger/review.ts`, `lib/physics-lab/knowledge-base/laws.ts` |
| [09](session-09.png) | Alimzhan Tokushev | Planted-bug example project for the demo | `examples/spring_mass_sim.py` |

## IBM Bob 2.0 features used

| Feature | Where |
|---|---|
| Agent mode | Multi-step builds across sessions 02–07 |
| Repository context | Codebase analysis in session 01 |
| Document understanding | Turning physics references into the law registry in session 03 |
