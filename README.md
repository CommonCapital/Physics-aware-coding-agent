# Physics Simulation Lab

An open-source, AI-powered physics simulation environment. Describe a physical scenario in plain language — the phenomenon, geometry, values, and units — and the AI agent writes a live browser simulation grounded in real, validated physics. Every simulation displays its governing equations, assumptions, limitations, and verification status alongside the numbers.

Built for engineers verifying hypotheses before committing to real designs, and for students building physical intuition.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What it does

You type a description of a physical scenario. The agent:

1. Classifies the request (educational, preliminary engineering analysis, conceptual visualization, or unsupported)
2. Asks for any missing inputs — one question at a time, never inventing values
3. Calls a validated solver from the physics catalog
4. Writes a browser simulation with the result, governing equations, assumptions, and limitations displayed

The simulation runs live in the browser beside the conversation. Every turn the agent makes an edit, the preview reloads.

---

## Physics catalog

The agent is **hard-constrained** to this catalog. It cannot write its own physics, improvise equations, or produce numbers outside these models.

### Mechanics
| Model | Solver |
|---|---|
| 2D projectile motion (no drag) | `solveProjectileMotion` |
| Simply supported beam — central point load | `solveSimplySupportedBeam` |
| Simply supported beam — uniform distributed load | `solveSimplySupportedBeam` |
| Simple pendulum — exact nonlinear (RK4) | `solveSimplePendulum` |
| Physical pendulum — rigid body (RK4) | `solvePhysicalPendulum` |
| Spring-mass — free and forced vibration (RK4) | `solveSpringMass` |
| Free fall — with optional linear Stokes drag | `solveFreeFall` |
| Uniform circular motion | `solveCircularMotion` |

### Fluid statics
| Model | Solver |
|---|---|
| Hydrostatic pressure profile | `solveFluidStatics` |
| Archimedes buoyancy (float/sink) | `solveFluidStatics` |

### Thermodynamics
| Model | Solver |
|---|---|
| Ideal gas — isothermal, isobaric, isochoric, adiabatic | `solveIdealGasProcess` |
| Linear thermal expansion | `solveThermalExpansion` |

### Electricity
| Model | Solver |
|---|---|
| Ohm's law and resistor networks | `solveOhmLaw` |
| RC circuit transient (charge/discharge) | `solveRCCircuit` |

All solvers live in [`lib/games/runtime/simulation/`](lib/games/runtime/simulation/) as plain ES module JavaScript — no build step, runs directly in the browser sandbox.

---

## Architecture

```
Next.js App (app/)
├── / — home page, prompt composer
└── /simulations/[id] — split view: chat thread | simulation preview

Trigger.dev (trigger/chat.ts)
└── simulationChat — durable chat agent, one session per simulation
    ├── onChatStart — creates Daytona sandbox
    ├── onTurnStart — persists thread before streaming
    ├── run — streamText → Claude (Opus 5 / Sonnet 5 / Haiku 4.5)
    └── onTurnComplete — persists messages + stream cursor

Daytona Sandbox
└── /home/daytona/game/
    ├── index.html, style.css (entry point)
    ├── report.js (error reporter — never edit)
    ├── simulation/ (validated solvers — never edit)
    │   ├── models/  — physics solvers
    │   ├── ui/      — report panel components
    │   └── index.js — barrel export
    ├── engine/ (three.js rendering toolkit — never edit)
    └── model.js, view.js, scenario.json (agent-written per simulation)
```

The agent writes only to `model.js`, `view.js`, `scene.js`, `scenario.json`, and any other files it creates. The `simulation/` and `engine/` directories are read-only from the agent's perspective.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via [Neon](https://neon.tech) + Drizzle ORM |
| AI runtime | [Trigger.dev](https://trigger.dev) `chat.agent` + Vercel AI SDK `streamText` |
| LLM | Anthropic Claude (Opus 5 / Sonnet 5 / Haiku 4.5) |
| Sandbox | [Daytona](https://daytona.io) (Linux sandboxes, static file server) |
| 3D rendering | [three.js](https://threejs.org) (via import map, no bundler) |
| Observability | Sentry |
| UI | shadcn/ui + Tailwind CSS |

---

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Anthropic](https://console.anthropic.com) API key
- A [Trigger.dev](https://trigger.dev) project
- A [Daytona](https://daytona.io) API key

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# Database (Neon)
DATABASE_URL=postgresql://...

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Trigger.dev
TRIGGER_SECRET_KEY=tr_...

# Daytona
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

# In a separate terminal, start the Trigger.dev dev worker
npm run trigger:dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
npm run test:simulation
```

The simulation tests run in Node.js directly against the solver modules — no browser required.

---

## Project structure

```
app/
├── (app)/
│   ├── layout.tsx           — sidebar layout
│   ├── page.tsx             — home page (prompt composer)
│   └── simulations/[id]/    — simulation view
│       └── page.tsx
├── api/simulations/[id]/preview/
│   └── route.ts             — serves preview URL from Daytona
└── layout.tsx               — root layout

components/
├── simulation-chat.tsx      — resizable split view
├── simulation-menu.tsx      — rename / delete
├── new-simulation-composer.tsx
├── chat-thread.tsx          — the conversation panel
├── chat-preview.tsx         — the simulation iframe
└── app-sidebar.tsx          — sidebar with recent simulations

lib/
├── physics-lab/             — core domain logic
│   ├── actions.ts           — server actions (create, rename, delete)
│   ├── agent.ts             — model settings
│   ├── authorize.ts         — authorization check
│   ├── chat-actions.ts      — Trigger.dev session server actions
│   ├── chat-session.ts      — session cleanup
│   ├── chat-store.ts        — thread persistence
│   ├── instructions/        — agent system prompt (workflow, runtime, engine)
│   ├── model-catalog.ts     — model ids and taglines
│   ├── models.ts            — Anthropic provider instances
│   ├── queries.ts           — DB read functions
│   ├── runtime/             — sandbox seed files
│   │   ├── simulation/      — physics solvers (browser ES modules)
│   │   │   ├── models/      — pendulum, spring-mass, beam, …
│   │   │   ├── ui/          — report panel, plots, controls
│   │   │   ├── index.js     — barrel export
│   │   │   ├── integration.js — RK4 integrator
│   │   │   ├── quality.js   — error / convergence analysis
│   │   │   ├── units.js     — unit conversion
│   │   │   └── validation.js
│   │   └── engine/          — three.js rendering toolkit
│   ├── seed.ts              — reads runtime/ for upload to Daytona
│   ├── suggestions.ts       — home-page prompt suggestions
│   ├── title.ts             — title length cap + truncation
│   └── tools.ts             — agent tool definitions (file I/O + ask_user)
├── daytona/                 — sandbox create/start/delete
├── db/                      — Drizzle schema + client
└── billing/                 — step pricing (cost tracking only)

trigger/
└── chat.ts                  — simulationChat agent task
```

---

## Adding a physics model

1. Write the solver in `lib/physics-lab/runtime/simulation/models/your-model.js` as a plain ES module.
   - Accept `{ value, unit }` quantity objects for every input.
   - Return SI values only. Convert at the edges with `convertUnit`.
   - Export a `YOUR_MODEL_METADATA` object with `id`, `name`, `assumptions`, `governingEquation(s)`, and `outputUnits`.
   - Throw on bad input — never return NaN or a silent default.

2. Export from [`lib/physics-lab/runtime/simulation/index.js`](lib/physics-lab/runtime/simulation/index.js).

3. Add units for any new physical quantity to [`lib/physics-lab/runtime/simulation/units.js`](lib/physics-lab/runtime/simulation/units.js).

4. Document the solver in the physics catalog section of [`lib/physics-lab/instructions/workflow.ts`](lib/physics-lab/instructions/workflow.ts) and add it to the import example in [`lib/physics-lab/instructions/runtime.ts`](lib/physics-lab/instructions/runtime.ts).

5. Add a representative suggestion to [`lib/physics-lab/suggestions.ts`](lib/physics-lab/suggestions.ts).

---

## Agent constraints

The agent prompt enforces strict physics integrity. The agent **cannot**:

- Invent a physical input, constant, or governing equation
- Write a physics solver outside `simulation/`
- Use `engine/physics.js` to produce a reported number (it is unverified arcade physics)
- Violate, approximate around, or otherwise break a conservation law
- Claim a result is safe, certified, or code-compliant
- Display a number without its unit
- Silently apply a default — every default must be offered explicitly and confirmed by the user

Any request for physics outside the catalog receives an honest refusal and an offer of a clearly labelled conceptual visualization instead.

---

## Contributing

Contributions welcome. The most useful additions are new validated physics solvers — see *Adding a physics model* above.

Please ensure:
- New solvers include unit tests under `tests/simulation/`
- The governing equations, assumptions, and limitations are documented in the solver file
- The solver throws on invalid input rather than returning a sentinel value

---

## License

[MIT](LICENSE)
