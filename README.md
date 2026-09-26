# PhysicsReview

**Physics-aware testing and code review for simulation developers.**

Catch the bugs that don't crash but give wrong answers: unit mix-ups, unstable time steps, sign errors, formulas applied outside their valid range.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The problem

Developers building simulation software — robotics, engineering/CAE, game engines, scientific computing — face a class of bugs that ordinary tests miss entirely. The code compiles, runs, and produces results. But those results are quietly wrong.

Examples that slip through standard CI:

- `KE = m * v ** 2` — missing the `½` factor, off by 2×
- Passing angle in degrees to `sin()` where radians are expected — plausible-looking output, wrong by a factor up to ~57×
- Applying Bernoulli to viscous pipe flow where Hagen-Poiseuille applies
- Using a time step larger than `T_n / 10` for a spring-mass RK4 integrator — numerical instability that looks like damping
- Temperature in Celsius when the ideal gas law expects Kelvin — pressure off by a factor of `T_celsius / 273`

These bugs require physics domain expertise to catch. That expertise is scarce, reviews are slow, and the errors compound.

---

## What PhysicsReview does

Upload source code (or paste a git diff) and get back:

### 1. Codebase-to-law mapping
Identifies which functions implement which physical laws — Newton's second law, Bernoulli, ideal gas, Coulomb's law, etc. — across Python, C++, JavaScript/TypeScript, Rust, MATLAB, Fortran, Julia, and more.

### 2. Physics-aware test generation
Generates tests that experts write by hand but rarely have time to:
- **Analytical benchmarks** — known closed-form results to compare against (e.g. free-fall displacement after 2 s = 19.613 m)
- **Conservation checks** — energy/momentum/mass must be conserved over a simulation run
- **Unit consistency** — same physics expressed in different input units must give the same result
- **Validity-range guards** — detect out-of-range usage before it produces garbage results
- **Sign-convention tests** — expose sign errors that produce plausible but wrong outputs

### 3. PR-level review
Reviews the changed code (or the full codebase) and flags physics violations in plain language with suggested fixes:
- Equation errors (wrong formula, missing constant, wrong factor)
- Unit mismatches (degrees vs radians, Celsius vs Kelvin, gauge vs absolute pressure)
- Sign errors (attractive force with wrong sign, downward acceleration with wrong sign)
- Validity violations (Bernoulli applied to turbulent flow, SUVAT with variable acceleration)
- Numerical stability issues (time step too large for the system's natural frequency)

---

## Physics knowledge base

14 physical laws across 6 domains, each with:
- Governing equations
- SI units for every quantity
- Validity conditions and applicability assumptions
- Known implementation bugs developers make
- Test templates for each law

| Domain | Laws |
|---|---|
| Classical mechanics | SUVAT, Newton's 2nd law, Projectile motion, Work-energy theorem, Circular motion, Spring-mass oscillator |
| Fluid mechanics | Bernoulli's equation, Reynolds number |
| Thermodynamics | Ideal gas law |
| Circuits | Ohm's law, RC circuit transient |
| Electromagnetism | Coulomb's law |
| Modern physics | Special relativity, Radioactive decay |

The knowledge base is in [`lib/physics-lab/knowledge-base/laws.ts`](lib/physics-lab/knowledge-base/laws.ts) — plain TypeScript, easy to extend.

---

## Architecture

```
Browser
├── / — ReviewComposer (upload files / paste diff)
└── /review/[id] — ReviewResults (findings · tests · mappings)
         │
         │  HTTP (Server Actions)
         ▼
Next.js App Router (app/)
├── page.tsx                     — home (review upload)
├── review/[id]/page.tsx         — results page
└── Server Actions               — createReviewJob · deleteReviewJob
         │
         │  Trigger.dev SDK
         ▼
Trigger.dev  schemaTask  "physics-review"
├── Pass 1: Law mapping   — codebase → law IDs (balanced model)
├── Pass 2: Test generation — law mappings → test code (balanced model)
└── Pass 3: Review         — physics violations + findings (thorough model)
         │
         │  Database (PostgreSQL via Neon)
         ▼
review_jobs table
├── source files (JSONB)
├── law mappings (JSONB)
├── findings (JSONB)
├── generated tests (JSONB)
└── summary (text)
```

The simulation builder (Physics Simulation Lab) is preserved alongside the review product. Existing simulations are accessible via the sidebar.

---

## Multi-provider LLM support

The review agent is not tied to a single LLM. Set `LLM_PROVIDER` in your environment to switch providers:

```bash
LLM_PROVIDER=claude    # Anthropic Claude (default)
LLM_PROVIDER=openai    # OpenAI
LLM_PROVIDER=deepseek  # DeepSeek
```

Each provider exposes three tiers used by the review pipeline:
- **thorough** — most capable model (used for the review pass)
- **balanced** — quality/speed tradeoff (used for law mapping and test generation)
- **fast** — lowest latency (used for title generation)

| Provider | Thorough | Balanced | Fast |
|---|---|---|---|
| Claude | claude-opus-5 | claude-sonnet-5 | claude-haiku-4-5 |
| OpenAI | o3 | gpt-4.1 | gpt-4.1-mini |
| DeepSeek | deepseek-reasoner | deepseek-chat | deepseek-chat |

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via [Neon](https://neon.tech) + Drizzle ORM |
| AI runtime | [Trigger.dev](https://trigger.dev) `schemaTask` + Vercel AI SDK `generateText` |
| LLM | Claude / OpenAI / DeepSeek (configurable via `LLM_PROVIDER`) |
| Observability | Sentry |
| UI | shadcn/ui + Tailwind CSS |

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- An API key for at least one LLM provider:
  - Anthropic: `ANTHROPIC_API_KEY`
  - OpenAI: `OPENAI_API_KEY`
  - DeepSeek: `DEEPSEEK_API_KEY`
- A [Trigger.dev](https://trigger.dev) project

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Database
DATABASE_URL=postgresql://...

# LLM provider (choose one: claude | openai | deepseek)
LLM_PROVIDER=claude

# API keys — set the one matching LLM_PROVIDER
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# Trigger.dev
TRIGGER_SECRET_KEY=tr_...

# Daytona (only needed for the simulation builder)
DAYTONA_API_KEY=...

# Sentry (optional)
SENTRY_DSN=https://...
SENTRY_ORG=...
SENTRY_PROJECT=...
SENTRY_AUTH_TOKEN=...
```

### Install and run

```bash
npm install

# Push the database schema (no migrations — dev only)
npm run db:push

# Start the Next.js dev server
npm run dev

# In a separate terminal, start the Trigger.dev worker
npm run trigger:dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
app/
├── (app)/
│   ├── layout.tsx               — sidebar layout
│   ├── page.tsx                 — home page (review upload)
│   └── review/[id]/
│       └── page.tsx             — review results page
│   └── simulations/[id]/
│       └── page.tsx             — simulation view (preserved)

components/
├── review-composer.tsx          — file upload + diff input
├── review-results.tsx           — findings · tests · mappings tabs
├── app-sidebar.tsx              — sidebar with review history + simulations
├── simulation-chat.tsx          — simulation builder (preserved)
└── ...

lib/
├── llm/                         — multi-provider LLM abstraction
│   ├── provider.ts              — reads LLM_PROVIDER env var
│   ├── models.ts                — Claude / OpenAI / DeepSeek instances
│   ├── catalog.ts               — UI model list per provider
│   └── index.ts
├── physics-lab/
│   ├── knowledge-base/          — physics law registry
│   │   ├── laws.ts              — 14 laws with equations, units, bugs, test templates
│   │   └── index.ts
│   ├── instructions/
│   │   ├── law-mapper.ts        — system prompt: codebase → law mapping
│   │   ├── test-generator.ts    — system prompt: law mappings → test code
│   │   ├── reviewer.ts          — system prompt: physics violation review
│   │   └── ... (simulation builder instructions preserved)
│   ├── review-actions.ts        — server actions: createReviewJob · deleteReviewJob
│   ├── review-store.ts          — DB persistence for review jobs
│   └── queries.ts               — listReviewJobs · getReviewJob (+ simulation queries)
├── db/
│   └── schema.ts                — review_jobs table (added) + simulations table

trigger/
├── review.ts                    — physics review task (3 passes)
└── chat.ts                      — simulation chat agent (preserved)
```

---

## Extending the knowledge base

Add a new law to [`lib/physics-lab/knowledge-base/laws.ts`](lib/physics-lab/knowledge-base/laws.ts):

```ts
const MY_LAW: PhysicsLaw = {
  id: "my-law-kebab-id",
  name: "My Law Name",
  domain: "classical-mechanics",  // or fluid-mechanics, thermodynamics, etc.
  equations: ["F = ma", "..."],
  quantities: [
    { symbol: "F", description: "force", siUnit: "N" },
    // ...
  ],
  assumptions: ["assumption 1", "assumption 2"],
  validityRanges: [
    { condition: "v ≪ c", reason: "non-relativistic only" },
  ],
  commonBugs: [
    "forgetting the ½ factor",
    "unit mismatch: degrees vs radians",
  ],
  testTemplates: [
    {
      id: "my-law-benchmark",
      kind: "analytical_benchmark",
      description: "Known input → known output",
      assertion: "result = 42.0 ± 0.001",
    },
  ],
  solverFunctions: ["myLawSolverFunctionName"],
}
```

Then add it to the `PHYSICS_LAWS` array at the bottom of the file. The review and test-generation agents automatically pick it up.

---

## Simulation builder (preserved)

The original Physics Simulation Lab is fully preserved and accessible. `/simulations/[id]` works as before. The simulation builder uses the same multi-provider LLM abstraction — set `LLM_PROVIDER` and it uses the configured provider there too.

---

## Contributing

The most impactful contributions:
1. **New laws in the knowledge base** — more coverage means more bugs caught
2. **Language-specific test templates** — the generator knows physics but you know Python idioms
3. **Bug pattern examples** — if you've seen a physics bug in the wild, document it

---

## License

[MIT](LICENSE)
