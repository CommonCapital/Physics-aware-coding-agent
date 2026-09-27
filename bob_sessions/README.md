# IBM Bob 2.0 — Usage Evidence

This folder contains screenshots from IBM Bob 2.0 sessions used to build PhysicsReview.

## How IBM Bob 2.0 was used

| Session | What Bob helped build | Files produced |
|---|---|---|
| [session-01](session-01.png) | Deep codebase analysis + full product architecture design (knowledge base, law mapping, test generation, PR review pipeline, multi-provider LLM abstraction) | Architecture plan |
| [session-02](session-02.png) | Multi-provider LLM abstraction layer | `lib/llm/provider.ts`, `lib/llm/models.ts`, `lib/llm/catalog.ts`, `lib/llm/index.ts` |
| [session-03](session-03.png) | Physics knowledge base — 14 laws with equations, SI units, validity ranges, common bugs, test templates | `lib/physics-lab/knowledge-base/laws.ts` |
| [session-04](session-04.png) | Agent system prompts for law mapping, test generation, and PR review passes | `lib/physics-lab/instructions/law-mapper.ts`, `reviewer.ts`, `test-generator.ts` |
| [session-05](session-05.png) | Trigger.dev 3-pass review task with `generateObject` + Zod schemas | `trigger/review.ts` |
| [session-06](session-06.png) | Review UI components and pages | `components/review-composer.tsx`, `components/review-results.tsx`, `app/(app)/review/[id]/page.tsx` |
| [session-07](session-07.png) | DB schema (`review_jobs` table), server actions, store, queries | `lib/db/schema.ts`, `lib/physics-lab/review-actions.ts`, `lib/physics-lab/review-store.ts` |
| [session-08](session-08.png) | Bug fixes: `generateObject` migration, line numbers in prompts, auto-refresh, physics constant correction | `trigger/review.ts`, `lib/physics-lab/knowledge-base/laws.ts` |
| [session-09](session-09.png) | Planted-bug example project for demo | `examples/spring_mass_sim.py` |

## Team members

Add a screenshot for each team member below — Bob requires evidence from every member.

| Team member | Screenshot | Task run in Bob |
|---|---|---|
| Member 1 | [session-01.png](session-01.png) | Product architecture design |
| Member 2 | _(add screenshot)_ | _(describe task)_ |

## How to add your screenshot

1. Run any task in IBM Bob 2.0 (e.g. ask it to explain a file, fix a bug, or generate a test)
2. Take a screenshot of the Bob session showing your name / account
3. Save it as `bob_sessions/your-name.png`
4. Add a row to the table above
