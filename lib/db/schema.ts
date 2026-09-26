import type { UIMessage } from "ai"
import { sql } from "drizzle-orm"
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const simulations = pgTable(
  "simulations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    // The simulation's chat thread, in the `useChat` UI message format.
    messages: jsonb("messages")
      .$type<UIMessage[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    // Trigger.dev chat session state for the thread above.
    chatAccessToken: text("chat_access_token"),
    chatLastEventId: text("chat_last_event_id"),
    // The Daytona sandbox the simulation is built in.
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("simulations_created_at_idx").on(table.createdAt.desc()),
  ]
)

export type Simulation = typeof simulations.$inferSelect
export type NewSimulation = typeof simulations.$inferInsert

// ---------------------------------------------------------------------------
// Review jobs — one row per physics review analysis request
// ---------------------------------------------------------------------------

export interface ReviewFinding {
  lawId: string
  lawName: string
  severity: "critical" | "warning" | "info"
  file: string
  lines?: string
  message: string
  suggestedFix?: string
}

export interface GeneratedTest {
  templateId: string
  lawId: string
  kind: string
  description: string
  code: string
  language: string
}

export interface LawMapping {
  functionName: string
  file: string
  lines?: string
  detectedLaws: string[]
  confidence: "high" | "medium" | "low"
  notes?: string
}

export const reviewJobs = pgTable(
  "review_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human-readable description supplied by the user */
    title: text("title").notNull(),
    /** Source language of the uploaded code (e.g. "python", "cpp") */
    language: text("language").notNull().default("unknown"),
    /** Raw job status */
    status: text("status")
      .$type<"pending" | "running" | "done" | "failed">()
      .notNull()
      .default("pending"),
    /** Uploaded source files: array of { path, content } */
    sourceFiles: jsonb("source_files")
      .$type<Array<{ path: string; content: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Optional git diff for PR-level review */
    diff: text("diff"),
    /** Laws the user wants to focus on (subset of LAW_IDS), or empty = all */
    targetLawIds: jsonb("target_law_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Detected function → law mappings */
    lawMappings: jsonb("law_mappings")
      .$type<LawMapping[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Review findings */
    findings: jsonb("findings")
      .$type<ReviewFinding[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Generated test cases */
    generatedTests: jsonb("generated_tests")
      .$type<GeneratedTest[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** Summary text produced by the review agent */
    summary: text("summary"),
    /** Total findings by severity */
    criticalCount: integer("critical_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    /** Trigger.dev chat session state */
    chatAccessToken: text("chat_access_token"),
    chatLastEventId: text("chat_last_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("review_jobs_created_at_idx").on(table.createdAt.desc()),
    index("review_jobs_status_idx").on(table.status),
  ]
)

export type ReviewJob = typeof reviewJobs.$inferSelect
export type NewReviewJob = typeof reviewJobs.$inferInsert

// ---------------------------------------------------------------------------
// Backward-compatible re-exports so any code still importing "games" compiles.
// Remove these once all callers are updated.
// ---------------------------------------------------------------------------
export const games = simulations
export type Game = Simulation
export type NewGame = NewSimulation
