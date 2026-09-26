/**
 * Persistence layer for physics review jobs.
 *
 * Called from inside Trigger.dev worker tasks — imports from ./client
 * (not ./index which has the server-only marker).
 */

import { eq } from "drizzle-orm"

import { db, reviewJobs } from "@/lib/db/client"
import type {
  ReviewFinding,
  GeneratedTest,
  LawMapping,
  ReviewJob,
} from "@/lib/db/schema"

export type { ReviewFinding, GeneratedTest, LawMapping }

export async function loadReviewJob(jobId: string): Promise<ReviewJob | null> {
  const [row] = await db
    .select()
    .from(reviewJobs)
    .where(eq(reviewJobs.id, jobId))
    .limit(1)

  return row ?? null
}

export async function updateReviewJobStatus(
  jobId: string,
  status: ReviewJob["status"]
): Promise<void> {
  await db
    .update(reviewJobs)
    .set({ status })
    .where(eq(reviewJobs.id, jobId))
}

export async function saveReviewMappings(
  jobId: string,
  mappings: LawMapping[]
): Promise<void> {
  await db
    .update(reviewJobs)
    .set({ lawMappings: mappings })
    .where(eq(reviewJobs.id, jobId))
}

export async function saveReviewResults({
  jobId,
  findings,
  generatedTests,
  summary,
  chatAccessToken,
  chatLastEventId,
}: {
  jobId: string
  findings: ReviewFinding[]
  generatedTests: GeneratedTest[]
  summary: string
  chatAccessToken?: string
  chatLastEventId?: string
}): Promise<void> {
  const criticalCount = findings.filter((f) => f.severity === "critical").length
  const warningCount = findings.filter((f) => f.severity === "warning").length

  await db
    .update(reviewJobs)
    .set({
      findings,
      generatedTests,
      summary,
      criticalCount,
      warningCount,
      status: "done",
      chatAccessToken,
      chatLastEventId,
    })
    .where(eq(reviewJobs.id, jobId))
}

export async function markReviewFailed(jobId: string): Promise<void> {
  await db
    .update(reviewJobs)
    .set({ status: "failed" })
    .where(eq(reviewJobs.id, jobId))
}
