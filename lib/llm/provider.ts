/**
 * Reads the LLM_PROVIDER environment variable and returns the active provider.
 *
 * Supported values: "claude" (default), "openai", "deepseek"
 *
 * This is the single source of truth for which provider is active. Every
 * model instantiation goes through here so that swapping the env var at
 * deploy time is all it takes to change providers everywhere.
 */

export type LLMProvider = "claude" | "openai" | "deepseek"

const SUPPORTED_PROVIDERS: LLMProvider[] = ["claude", "openai", "deepseek"]

/** The active provider, read once at module load time. */
export const ACTIVE_PROVIDER: LLMProvider = ((): LLMProvider => {
  const raw = process.env.LLM_PROVIDER?.toLowerCase().trim()

  if (!raw) return "claude"

  if (!SUPPORTED_PROVIDERS.includes(raw as LLMProvider)) {
    console.warn(
      `[llm] Unknown LLM_PROVIDER "${raw}". Falling back to "claude". ` +
        `Supported values: ${SUPPORTED_PROVIDERS.join(", ")}`
    )
    return "claude"
  }

  return raw as LLMProvider
})()

export function isLLMProvider(value: unknown): value is LLMProvider {
  return SUPPORTED_PROVIDERS.includes(value as LLMProvider)
}
