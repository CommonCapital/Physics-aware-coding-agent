# IBM Bob 2.0 — Usage Evidence

This folder contains screenshots from IBM Bob 2.0 sessions used to build PhysicsReview.

## How IBM Bob 2.0 was used

| Session | What Bob helped build | Files produced | Team Member
|---|---|---|
| [session-01](session-01.png) | Deep codebase analysis + full product architecture design (knowledge base, law mapping, test generation, PR review pipeline, multi-provider LLM abstraction) | Architecture plan |  Nursan Omarov |
| [session-02](session-02.png) | Multi-provider LLM abstraction layer | `lib/llm/provider.ts`, `lib/llm/models.ts`, `lib/llm/catalog.ts`, `lib/llm/index.ts` | Alimzhan Tokushev |
| [session-03](session-03.png) | Physics knowledge base — 14 laws with equations, SI units, validity ranges, common bugs, test templates | `lib/physics-lab/knowledge-base/laws.ts` | Nursan Omarov |
| [session-04](session-04.png) | Agent system prompts for law mapping, test generation, and PR review passes | `lib/physics-lab/instructions/law-mapper.ts`, `reviewer.ts`, `test-generator.ts` | Nursan Omarov |
| [session-05](session-05.png) | Trigger.dev 3-pass review task with `generateObject` + Zod schemas | `trigger/review.ts` | Alimzhan Tokushev |
| [session-06](session-06.png) | Review UI components and pages | `components/review-composer.tsx`, `components/review-results.tsx`, `app/(app)/review/[id]/page.tsx` | Alimzhan Tokushev |
| [session-07](session-07.png) | DB schema (`review_jobs` table), server actions, store, queries | `lib/db/schema.ts`, `lib/physics-lab/review-actions.ts`, `lib/physics-lab/review-store.ts` | Alimzhan Tokushev |
| [session-08](session-08.png) | Bug fixes: `generateObject` migration, line numbers in prompts, auto-refresh, physics constant correction | `trigger/review.ts`, `lib/physics-lab/knowledge-base/laws.ts` | Nursan Omarov |
| [session-09](session-09.png) | Planted-bug example project for demo | `examples/spring_mass_sim.py` | Alimzhan Tokushev |

