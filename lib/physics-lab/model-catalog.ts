/**
 * Simulation model catalog — provider-aware.
 *
 * At runtime, the active catalog is read from the LLM abstraction layer
 * (driven by LLM_PROVIDER env var). This file re-exports the right catalog
 * entries so the rest of the app (including the UI) stays untouched.
 *
 * Client-safe on purpose: only IDs and copy, no SDK instances or API keys.
 */

import { ACTIVE_PROVIDER, getProviderCatalog, getDefaultModelId } from "@/lib/llm"

// Re-export the active provider's models as SIMULATION_MODELS so every
// existing import keeps compiling.
export const SIMULATION_MODELS = getProviderCatalog(ACTIVE_PROVIDER).map(
  (m) => ({ id: m.id, name: m.name, tagline: m.tagline })
) as readonly { id: string; name: string; tagline: string }[]

export type SimulationModelId = string

// Keep backward-compatible aliases
export const GAME_MODELS = SIMULATION_MODELS
export type GameModelId = SimulationModelId

export const DEFAULT_SIMULATION_MODEL_ID: SimulationModelId =
  getDefaultModelId(ACTIVE_PROVIDER)
export const DEFAULT_GAME_MODEL_ID = DEFAULT_SIMULATION_MODEL_ID

export function isSimulationModelId(value: unknown): value is SimulationModelId {
  return SIMULATION_MODELS.some((model) => model.id === value)
}

export const isGameModelId = isSimulationModelId
