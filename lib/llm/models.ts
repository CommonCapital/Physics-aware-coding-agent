/**
 * Per-provider model tiers.
 *
 * Each provider exposes three tiers that map onto the same three use-cases:
 *   thorough  — highest capability, slowest (used for new analysis / complex code)
 *   balanced  — quality/speed tradeoff (used for iterating)
 *   fast      — lowest latency + cost (used for title gen, quick fixes)
 *
 * DeepSeek uses its dedicated provider rather than the OpenAI one: the OpenAI
 * provider defaults to the Responses API, which DeepSeek does not implement.
 */

import { createAnthropic } from "@ai-sdk/anthropic"
import { createDeepSeek } from "@ai-sdk/deepseek"
import { createOpenAI } from "@ai-sdk/openai"

import type { LLMProvider } from "./provider"

// Use a structural type rather than the strict LanguageModel union so that
// slightly different protocol versions (V1 from older @ai-sdk/* packages)
// don't cause type errors. The AI SDK accepts all of them at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLanguageModel = any

// ---------------------------------------------------------------------------
// Provider model IDs
// ---------------------------------------------------------------------------

export const CLAUDE_MODELS = {
  thorough: "claude-opus-5",
  balanced: "claude-sonnet-5",
  fast: "claude-haiku-4-5",
} as const

export const OPENAI_MODELS = {
  thorough: "o3",
  balanced: "gpt-4.1",
  fast: "gpt-4.1-mini",
} as const

export const DEEPSEEK_MODELS = {
  thorough: "deepseek-reasoner",
  balanced: "deepseek-chat",
  fast: "deepseek-chat",
} as const

export type ModelTier = "thorough" | "balanced" | "fast"

// ---------------------------------------------------------------------------
// Lazy provider factories
// ---------------------------------------------------------------------------

function getAnthropicModel(tier: ModelTier): AnyLanguageModel {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
  return anthropic(CLAUDE_MODELS[tier])
}

function getOpenAIModel(tier: ModelTier): AnyLanguageModel {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  return openai(OPENAI_MODELS[tier])
}

function getDeepSeekModel(tier: ModelTier): AnyLanguageModel {
  const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY,
  })
  return deepseek(DEEPSEEK_MODELS[tier])
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a language model for the given tier using the active provider.
 * The provider is determined by `ACTIVE_PROVIDER` (LLM_PROVIDER env var).
 */
export function getModel(
  tier: ModelTier,
  provider: LLMProvider
): AnyLanguageModel {
  switch (provider) {
    case "claude":
      return getAnthropicModel(tier)
    case "openai":
      return getOpenAIModel(tier)
    case "deepseek":
      return getDeepSeekModel(tier)
  }
}

/**
 * Returns the display name of the model for the given tier + provider.
 * Used in UI labels and log fields.
 */
export function getModelId(tier: ModelTier, provider: LLMProvider): string {
  switch (provider) {
    case "claude":
      return CLAUDE_MODELS[tier]
    case "openai":
      return OPENAI_MODELS[tier]
    case "deepseek":
      return DEEPSEEK_MODELS[tier]
  }
}
