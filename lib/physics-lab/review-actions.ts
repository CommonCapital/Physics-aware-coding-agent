"use server"

import * as Sentry from "@sentry/nextjs"
import { tasks } from "@trigger.dev/sdk"
import { eq } from "drizzle-orm"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"

import { db, reviewJobs } from "@/lib/db"
import { describeError, elapsed } from "@/lib/observability"
import { truncateTitle } from "@/lib/physics-lab/title"

import type { physicsReviewTask } from "@/trigger/review"

/**
 * Creates a review job and triggers the physics analysis task.
 */
export async function createReviewJob({
  title,
  language,
  files,
  diff,
  targetLawIds,
}: {
  title: string
  language: string
  files: Array<{ path: string; content: string }>
  diff?: string
  targetLawIds?: string[]
}) {
  const startedAt = performance.now()

  const trimmedTitle = typeof title === "string" ? title.trim() : "Physics Review"

  const [job] = await db
    .insert(reviewJobs)
    .values({
      title: truncateTitle(trimmedTitle || "Physics Review"),
      language: language || "unknown",
      sourceFiles: files,
      diff: diff ?? null,
      targetLawIds: targetLawIds ?? [],
      status: "pending",
    })
    .returning({ id: reviewJobs.id })

  // Trigger the background analysis
  await tasks.trigger<typeof physicsReviewTask>("physics-review", {
    jobId: job.id,
  })

  Sentry.logger.info(Sentry.logger.fmt`Created review job ${job.id}`, {
    "app.action": "createReviewJob",
    "review.id": job.id,
    "review.files": files.length,
    "review.language": language,
    duration_ms: elapsed(startedAt),
  })

  refresh()

  redirect(`/review/${job.id}`)
}

/**
 * Deletes a review job and its results.
 */
export async function deleteReviewJob(jobId: string, returnHome: boolean) {
  const startedAt = performance.now()

  try {
    await db.delete(reviewJobs).where(eq(reviewJobs.id, jobId))

    Sentry.logger.info(Sentry.logger.fmt`Deleted review job ${jobId}`, {
      "app.action": "deleteReviewJob",
      "review.id": jobId,
      duration_ms: elapsed(startedAt),
    })
  } catch (error) {
    Sentry.logger.error(
      Sentry.logger.fmt`Could not delete review job ${jobId}`,
      {
        "app.action": "deleteReviewJob",
        "review.id": jobId,
        ...describeError(error),
      }
    )
    throw error
  }

  refresh()

  if (returnHome) {
    redirect("/")
  }
}
