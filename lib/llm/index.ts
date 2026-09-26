/**
 * LLM abstraction layer.
 *
 * Import from here rather than from individual files:
 *
 *   import { getModel, getModelId, ACTIVE_PROVIDER } from "@/lib/llm"
 *
 * For the UI catalog:
 *
 *   import { getProviderCatalog, getDefaultModelId } from "@/lib/llm"
 */

export { ACTIVE_PROVIDER, isLLMProvider } from "./provider"
export type { LLMProvider } from "./provider"

export { getModel, getModelId } from "./models"
export type { ModelTier } from "./models"

export { getProviderCatalog, getDefaultModelId, MODEL_CATALOGS } from "./catalog"
export type { ModelEntry } from "./catalog"
