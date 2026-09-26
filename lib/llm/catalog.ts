/**
 * Client-safe catalog of available models per provider.
 *
 * This is what the UI model picker reads. It contains only IDs and display
 * copy — no SDK instances or API keys.
 */

import type { LLMProvider } from "./provider"

export interface ModelEntry {
  id: string
  name: string
  tagline: string
  tier: "thorough" | "balanced" | "fast"
}

const CLAUDE_CATALOG: ModelEntry[] = [
  {
    id: "claude-opus-5",
    name: "Opus 5",
    tagline: "Most thorough — best for complex codebases and new analyses.",
    tier: "thorough",
  },
  {
    id: "claude-sonnet-5",
    name: "Sonnet 5",
    tagline: "Balanced capability and speed. Good for iterating.",
    tier: "balanced",
  },
  {
    id: "claude-haiku-4-5",
    name: "Haiku 4.5",
    tagline: "Fastest — best for targeted checks and quick fixes.",
    tier: "fast",
  },
]

const OPENAI_CATALOG: ModelEntry[] = [
  {
    id: "o3",
    name: "o3",
    tagline: "Most thorough — best for complex codebases and new analyses.",
    tier: "thorough",
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    tagline: "Balanced capability and speed. Good for iterating.",
    tier: "balanced",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    tagline: "Fastest — best for targeted checks and quick fixes.",
    tier: "fast",
  },
]

const DEEPSEEK_CATALOG: ModelEntry[] = [
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    tagline: "Most thorough — best for complex codebases and new analyses.",
    tier: "thorough",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    tagline: "Balanced capability and speed. Good for iterating.",
    tier: "balanced",
  },
]

export const MODEL_CATALOGS: Record<LLMProvider, ModelEntry[]> = {
  claude: CLAUDE_CATALOG,
  openai: OPENAI_CATALOG,
  deepseek: DEEPSEEK_CATALOG,
}

export function getProviderCatalog(provider: LLMProvider): ModelEntry[] {
  return MODEL_CATALOGS[provider]
}

export function getDefaultModelId(provider: LLMProvider): string {
  return MODEL_CATALOGS[provider][0].id
}
