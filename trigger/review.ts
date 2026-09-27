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
import { generateObject } from "ai"
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

// ─── Zod schemas for structured LLM output ───────────────────────────────────

const LawMappingSchema = z.object({
  functionName: z.string(),
  file: z.string(),
  lines: z.string().optional(),
  detectedLaws: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
})

const LawMappingsSchema = z.object({
  mappings: z.array(LawMappingSchema),
})

const GeneratedTestSchema = z.object({
  templateId: z.string(),
  lawId: z.string(),
  kind: z.string(),
  description: z.string(),
  code: z.string(),
  language: z.string(),
})

const GeneratedTestsSchema = z.object({
  tests: z.array(GeneratedTestSchema),
})

const ReviewFindingSchema = z.object({
  lawId: z.string().nullable().optional(),
  lawName: z.string(),
  severity: z.enum(["critical", "warning", "info"]),
  file: z.string(),
  lines: z.string().optional(),
  message: z.string(),
  suggestedFix: z.string().optional(),
})

const ReviewResultSchema = z.object({
  findings: z.array(ReviewFindingSchema),
  summary: z.string(),
})

// ─── Build source message with line numbers ───────────────────────────────────

/**
 * Build a user message containing the source code files.
 * Each line is prefixed with its line number so the model can cite exact locations.
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
    const numbered = file.content
      .split("\n")
      .map((line, i) => `${String(i + 1).padStart(4, " ")} | ${line}`)
      .join("\n")
    parts.push(`## File: ${file.path}\n\n\`\`\`${ext}\n${numbered}\n\`\`\``)
  }

  return parts.join("\n\n")
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export const physicsReviewTask = schemaTask({
  id: "physics-review",
  schema: z.object({ jobId: z.string().uuid() }),
  retry: { maxAttempts: 2 },

  run: async ({ jobId }) => {
    const startedAt = performance.now()

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

    // ─── Pass 1: Law Mapping ──────────────────────────────────────────────────
    let mappings: LawMapping[] = []

    try {
      const mapStartedAt = performance.now()

      const mapResult = await generateObject({
        model: getModel("balanced", ACTIVE_PROVIDER),
        system: lawMapperInstructions(job.language),
        prompt: sourceMessage,
        schema: LawMappingsSchema,
        maxOutputTokens: MAX_TOKENS_PER_PASS,
      })

      mappings = mapResult.object.mappings as LawMapping[]

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
      // Continue with empty mappings — review pass can still run
    }

    // ─── Pass 2: Test Generation ──────────────────────────────────────────────
    let generatedTests: GeneratedTest[] = []

    if (mappings.length > 0) {
      try {
        const testStartedAt = performance.now()

        const testResult = await generateObject({
          model: getModel("balanced", ACTIVE_PROVIDER),
          system: testGeneratorInstructions(job.language, mappings),
          prompt: sourceMessage,
          schema: GeneratedTestsSchema,
          maxOutputTokens: MAX_TOKENS_PER_PASS,
        })

        generatedTests = testResult.object.tests as GeneratedTest[]

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

    // ─── Pass 3: Physics Review ───────────────────────────────────────────────
    let findings: ReviewFinding[] = []
    let summary = ""

    try {
      const reviewStartedAt = performance.now()

      const reviewResult = await generateObject({
        model: getModel("thorough", ACTIVE_PROVIDER),
        system: reviewerInstructions(job.language, mappings, Boolean(job.diff)),
        prompt: sourceMessage,
        schema: ReviewResultSchema,
        maxOutputTokens: MAX_TOKENS_PER_PASS,
      })

      findings = reviewResult.object.findings as ReviewFinding[]
      summary = reviewResult.object.summary

      logger.info(logger.fmt`Physics review complete for job ${jobId}`, {
        "review.id": jobId,
        "review.findings": findings.length,
        "review.critical": findings.filter((f) => f.severity === "critical").length,
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

    // ─── Persist results ──────────────────────────────────────────────────────
    await saveReviewResults({
      jobId,
      findings,
      generatedTests,
      summary:
        summary ||
        `Analysis complete: ${findings.length} findings, ${generatedTests.length} tests generated.`,
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
