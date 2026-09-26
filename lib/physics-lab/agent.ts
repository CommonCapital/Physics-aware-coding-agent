/**
 * Physics-lab model settings — delegates to the multi-provider LLM abstraction.
 *
 * The simulation chat task still works the same way: it calls
 * `simulationModelSettings(modelId)` and gets back `{ model: LanguageModel }`.
 *
 * The model ID now comes from the active provider's catalog rather than being
 * hardcoded to Claude. The active provider is determined by the LLM_PROVIDER
 * environment variable (default: "claude").
 */

import { ACTIVE_PROVIDER, getModel, getModelId } from "@/lib/llm"

import type { SimulationModelId } from "./model-catalog"

export function simulationModelSettings(
  _modelId?: SimulationModelId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { model: any } {
  // modelId here is a provider-qualified model id string (e.g. "claude-opus-5",
  // "gpt-4.1", "deepseek-chat"). We derive the tier from it via the catalog, or
  // fall back to "thorough" if unknown.
  const tier = tierFromModelId(_modelId)
  return { model: getModel(tier, ACTIVE_PROVIDER) }
}

/**
 * Returns the canonical model ID string for use in logs and billing.
 */
export function simulationModelId(modelId?: SimulationModelId): string {
  const tier = tierFromModelId(modelId)
  return getModelId(tier, ACTIVE_PROVIDER)
}

function tierFromModelId(
  modelId?: string
): "thorough" | "balanced" | "fast" {
  if (!modelId) return "thorough"

  const lower = modelId.toLowerCase()
  if (
    lower.includes("opus") ||
    lower.includes("o3") ||
    lower.includes("reasoner")
  ) {
    return "thorough"
  }
  if (
    lower.includes("haiku") ||
    lower.includes("mini") ||
    lower.includes("flash")
  ) {
    return "fast"
  }
  return "balanced"
}

// Backward-compatible alias
export const gameModelSettings = simulationModelSettings
