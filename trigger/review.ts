/**
 * Physics review orchestration task.
 *
 * Accepts a review job ID, runs three analysis passes in sequence:
 *   1. Law mapping  — identify which functions implement which physical laws
 *   2. Test generation — generate tests for each detected law
 *   3. Review       — flag physics violations, unit errors, sign bugs, etc.
 *
 * Results are persisted to the review_jobs table after each pass.
 */

import { schemaTask } from "@trigger.dev/sdk"
import { generateText } from "ai"
import { z } from "zod"

import { ACTIVE_PROVIDER, getModel, getModelId } from "@/lib/llm"
import { describeError, elapsed, logger } from "@/lib/observability"
import {
  lawMapperInstructions,
  testGeneratorInstructions,
  reviewerInstructions,
} from "@/lib/physics-lab/instructions"
import {
  loadReviewJob,
  markReviewFailed,
  saveReviewMappings,
  saveReviewResults,
  updateReviewJobStatus,
} from "@/lib/physics-lab/review-store"
import type { LawMapping, ReviewFinding, GeneratedTest } from "@/lib/physics-lab/review-store"

const MAX_TOKENS_PER_PASS = 8192

/**
 * Safely parse JSON from an LLM response, returning a fallback on failure.
 */
function safeParseJson<T>(text: string, fallback: T): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch {
    logger.warn("Failed to parse LLM JSON response", {
      "response.length": text.length,
      "response.preview": text.slice(0, 200),
    })
    return fallback
  }
}

/**
 * Build a user message containing the source code files.
 */
function buildSourceMessage(
  files: Array<{ path: string; content: string }>,
  diff?: string | null
): string {
  const parts: string[] = []

  if (diff) {
    parts.push("## Git diff (PR changes)\n\n```diff\n" + diff + "\n```")
  }

  for (const file of files) {
    const ext = file.path.split(".").pop() ?? "text"
    parts.push(
      `## File: ${file.path}\n\n\`\`\`${ext}\n${file.content}\n\`\`\``
    )
  }

  return parts.join("\n\n")
}

export const physicsReviewTask = schemaTask({
  id: "physics-review",
  schema: z.object({ jobId: z.string().uuid() }),
  retry: { maxAttempts: 2 },

  run: async ({ jobId }) => {
    const startedAt = performance.now()

    // Load the job
    const job = await loadReviewJob(jobId)

    if (!job) {
      throw new Error(`Review job ${jobId} not found`)
    }

    await updateReviewJobStatus(jobId, "running")

    logger.info(logger.fmt`Starting physics review for job ${jobId}`, {
      "review.id": jobId,
      "review.files": job.sourceFiles.length,
      "review.language": job.language,
      "review.provider": ACTIVE_PROVIDER,
      "review.model": getModelId("thorough", ACTIVE_PROVIDER),
    })

    const sourceMessage = buildSourceMessage(job.sourceFiles, job.diff)

    // ─── Pass 1: Law Mapping ────────────────────────────────────────────────
    let mappings: LawMapping[] = []

    try {
      const mapStartedAt = performance.now()

      const mapResult = await generateText({
        model: getModel("balanced", ACTIVE_PROVIDER),
        system: lawMapperInstructions(job.language),
        prompt: sourceMessage,
        maxOutputTokens: MAX_TOKENS_PER_PASS,
      })

      mappings = safeParseJson<LawMapping[]>(mapResult.text, [])

      await saveReviewMappings(jobId, mappings)

      logger.info(logger.fmt`Law mapping complete for job ${jobId}`, {
        "review.id": jobId,
        "review.mappings": mappings.length,
        "gen_ai.request.model": getModelId("balanced", ACTIVE_PROVIDER),
        duration_ms: elapsed(mapStartedAt),
      })
    } catch (error) {
      logger.error(logger.fmt`Law mapping failed for job ${jobId}`, {
        "review.id": jobId,
        ...describeError(error),
      })
      // Continue with empty mappings — tests and review may still work
    }

    // ─── Pass 2: Test Generation ────────────────────────────────────────────
    let generatedTests: GeneratedTest[] = []

    if (mappings.length > 0) {
      try {
        const testStartedAt = performance.now()

        const testResult = await generateText({
          model: getModel("balanced", ACTIVE_PROVIDER),
          system: testGeneratorInstructions(job.language, mappings),
          prompt: sourceMessage,
          maxOutputTokens: MAX_TOKENS_PER_PASS,
        })

        generatedTests = safeParseJson<GeneratedTest[]>(testResult.text, [])

        logger.info(logger.fmt`Test generation complete for job ${jobId}`, {
          "review.id": jobId,
          "review.tests": generatedTests.length,
          "gen_ai.request.model": getModelId("balanced", ACTIVE_PROVIDER),
          duration_ms: elapsed(testStartedAt),
        })
      } catch (error) {
        logger.error(logger.fmt`Test generation failed for job ${jobId}`, {
          "review.id": jobId,
          ...describeError(error),
        })
      }
    }

    // ─── Pass 3: Physics Review ─────────────────────────────────────────────
    let findings: ReviewFinding[] = []
    let summary = ""

    try {
      const reviewStartedAt = performance.now()

      const reviewResult = await generateText({
        model: getModel("thorough", ACTIVE_PROVIDER),
        system: reviewerInstructions(
          job.language,
          mappings,
          Boolean(job.diff)
        ),
        prompt: sourceMessage,
        maxOutputTokens: MAX_TOKENS_PER_PASS,
      })

      const parsed = safeParseJson<{
        findings: ReviewFinding[]
        summary: string
      }>(reviewResult.text, { findings: [], summary: "" })

      findings = parsed.findings ?? []
      summary = parsed.summary ?? ""

      logger.info(logger.fmt`Physics review complete for job ${jobId}`, {
        "review.id": jobId,
        "review.findings": findings.length,
        "review.critical": findings.filter((f) => f.severity === "critical")
          .length,
        "gen_ai.request.model": getModelId("thorough", ACTIVE_PROVIDER),
        duration_ms: elapsed(reviewStartedAt),
      })
    } catch (error) {
      logger.error(logger.fmt`Physics review pass failed for job ${jobId}`, {
        "review.id": jobId,
        ...describeError(error),
      })
      await markReviewFailed(jobId)
      throw error
    }

    // ─── Persist results ────────────────────────────────────────────────────
    await saveReviewResults({
      jobId,
      findings,
      generatedTests,
      summary:
        summary || `Analysis complete: ${findings.length} findings, ${generatedTests.length} tests generated.`,
    })

    logger.info(logger.fmt`Physics review saved for job ${jobId}`, {
      "review.id": jobId,
      "review.findings": findings.length,
      "review.tests": generatedTests.length,
      "review.mappings": mappings.length,
      duration_ms: elapsed(startedAt),
    })

    return {
      jobId,
      mappings: mappings.length,
      findings: findings.length,
      tests: generatedTests.length,
      critical: findings.filter((f) => f.severity === "critical").length,
    }
  },
})
