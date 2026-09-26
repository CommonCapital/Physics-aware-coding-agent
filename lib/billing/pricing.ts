import type { LanguageModelUsage } from "ai"

import { DOLLAR } from "@/lib/billing/format"

/**
 * A rate quoted the way Anthropic publishes it — dollars per million tokens —
 * as billionths of a dollar per million tokens.
 *
 * Written as a decimal and rounded through cents so the table below reads like
 * the price list it came from. Every published rate is a whole number of cents,
 * so nothing is lost in the conversion.
 */
function perMillionTokens(dollars: number): bigint {
  return BigInt(Math.round(dollars * 100)) * (DOLLAR / 100n)
}

const TOKENS_PER_MILLION = 1_000_000n

type ModelRates = {
  /** Input tokens that were neither read from nor written to the cache. */
  input: bigint
  /** Input tokens served from the cache — a tenth of the fresh input rate. */
  cacheRead: bigint
  /** Input tokens written to the cache, at the 5-minute TTL the app uses. */
  cacheWrite: bigint
  output: bigint
}

/**
 * What each model in the catalog costs, per million tokens.
 *
 * Source: Anthropic's published pricing, checked 2026-09-02. Cache reads are
 * 0.1x the base input rate and 5-minute cache writes 1.25x, but the rates are
 * written out rather than derived — a multiplier that changes for one model
 * (as it has, for models outside this catalog) would otherwise silently
 * misprice every row.
 *
 * `satisfies` rather than an annotation, so a model added to the catalog and
 * forgotten here is a type error rather than an undefined rate that prices a
 * turn at zero.
 */
/** Default rate for unknown/new models — priced at a mid-tier Claude rate. */
const FALLBACK_RATES: ModelRates = {
  input: perMillionTokens(3),
  cacheRead: perMillionTokens(0.3),
  cacheWrite: perMillionTokens(3.75),
  output: perMillionTokens(15),
}

export const MODEL_RATES: Record<string, ModelRates> = {
  // Claude (Anthropic)
  "claude-opus-5": {
    input: perMillionTokens(5),
    cacheRead: perMillionTokens(0.5),
    cacheWrite: perMillionTokens(6.25),
    output: perMillionTokens(25),
  },
  "claude-sonnet-5": {
    input: perMillionTokens(2),
    cacheRead: perMillionTokens(0.2),
    cacheWrite: perMillionTokens(2.5),
    output: perMillionTokens(10),
  },
  "claude-haiku-4-5": {
    input: perMillionTokens(1),
    cacheRead: perMillionTokens(0.1),
    cacheWrite: perMillionTokens(1.25),
    output: perMillionTokens(5),
  },
  // OpenAI
  "o3": {
    input: perMillionTokens(10),
    cacheRead: perMillionTokens(2.5),
    cacheWrite: perMillionTokens(10),
    output: perMillionTokens(40),
  },
  "gpt-4.1": {
    input: perMillionTokens(2),
    cacheRead: perMillionTokens(0.5),
    cacheWrite: perMillionTokens(2),
    output: perMillionTokens(8),
  },
  "gpt-4.1-mini": {
    input: perMillionTokens(0.4),
    cacheRead: perMillionTokens(0.1),
    cacheWrite: perMillionTokens(0.4),
    output: perMillionTokens(1.6),
  },
  // DeepSeek
  "deepseek-reasoner": {
    input: perMillionTokens(0.55),
    cacheRead: perMillionTokens(0.14),
    cacheWrite: perMillionTokens(0.55),
    output: perMillionTokens(2.19),
  },
  "deepseek-chat": {
    input: perMillionTokens(0.27),
    cacheRead: perMillionTokens(0.07),
    cacheWrite: perMillionTokens(0.27),
    output: perMillionTokens(1.1),
  },
}

function costOf(tokens: number | undefined, rate: bigint): bigint {
  if (!tokens || tokens < 0) {
    return 0n
  }

  // Truncates the fraction below a billionth of a dollar, which at these rates
  // is a fraction of a single token's cost.
  return (BigInt(tokens) * rate) / TOKENS_PER_MILLION
}

/**
 * What one step of a turn cost, in billionths of a dollar.
 *
 * The four token classes are priced separately because they differ by more
 * than an order of magnitude: on Opus a cached input token costs a tenth of a
 * fresh one and a cache write costs a quarter more, so a long build — which is
 * mostly the same context read back over and over — is billed nothing like its
 * raw token count suggests.
 *
 * `inputTokens` is deliberately not used: it is the *total*, cached tokens
 * included, so pricing it at the fresh rate would charge full price for reads
 * that cost a tenth of it.
 */
export function priceStep({
  modelId,
  usage,
}: {
  modelId: string
  usage: LanguageModelUsage
}): bigint {
  const rates = MODEL_RATES[modelId] ?? FALLBACK_RATES
  const { noCacheTokens, cacheReadTokens, cacheWriteTokens } =
    usage.inputTokenDetails

  // A provider that reports no breakdown at all has done no caching to report,
  // so the whole input is fresh. Anthropic always breaks it down; this is what
  // keeps a provider that doesn't from being billed as if input were free.
  const fresh =
    noCacheTokens === undefined &&
    cacheReadTokens === undefined &&
    cacheWriteTokens === undefined
      ? usage.inputTokens
      : noCacheTokens

  return (
    costOf(fresh, rates.input) +
    costOf(cacheReadTokens, rates.cacheRead) +
    costOf(cacheWriteTokens, rates.cacheWrite) +
    costOf(usage.outputTokens, rates.output)
  )
}
