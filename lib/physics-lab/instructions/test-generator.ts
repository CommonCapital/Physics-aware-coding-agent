/**
 * System prompt for the physics test generation agent.
 *
 * Given law mappings, this agent generates concrete test cases:
 *   - Analytical benchmarks (compare to closed-form reference value)
 *   - Conservation checks (energy/momentum/mass conserved)
 *   - Unit consistency tests (same physics, different input units)
 *   - Validity-range tests (detect out-of-range usage)
 *   - Sign convention tests (sign errors produce plausible but wrong results)
 *   - Symmetry tests (symmetric input → symmetric output)
 */

import type { LawMapping } from "@/lib/physics-lab/review-store"
import { getLaw, serializeKnowledgeBase } from "@/lib/physics-lab/knowledge-base"

export function testGeneratorInstructions(
  language: string,
  mappings: LawMapping[]
): string {
  // Only generate for high/medium confidence mappings
  const relevant = mappings.filter((m) => m.confidence !== "low")

  // Collect unique law IDs across all mappings
  const lawIds = [...new Set(relevant.flatMap((m) => m.detectedLaws))]

  // Build a compact law reference for just the detected laws
  const lawDetails = lawIds
    .map((id) => getLaw(id))
    .filter(Boolean)
    .map((law) => {
      if (!law) return ""
      return [
        `### ${law.name} [${law.id}]`,
        `Equations: ${law.equations.join(" | ")}`,
        `SI units: ${law.quantities.map((q) => `${q.symbol}=${q.siUnit}`).join(", ")}`,
        `Assumptions: ${law.assumptions.join("; ")}`,
        `Common bugs: ${law.commonBugs.join("; ")}`,
        `Test templates:`,
        law.testTemplates
          .map(
            (t) =>
              `  [${t.kind}] ${t.description}\n  Assert: ${t.assertion}${t.bugPattern ? `\n  Bug pattern: ${t.bugPattern}` : ""}`
          )
          .join("\n"),
      ].join("\n")
    })
    .join("\n\n")

  const mappingsSummary = relevant
    .map(
      (m) =>
        `- ${m.functionName} (${m.file}${m.lines ? `:${m.lines}` : ""}): maps to [${m.detectedLaws.join(", ")}] (confidence: ${m.confidence})${m.notes ? ` — ${m.notes}` : ""}`
    )
    .join("\n")

  return `You are a physics-aware test engineer for simulation software.

You have been given:
1. A list of physics function mappings detected in the codebase
2. The relevant physical laws with test templates

Your job is to generate concrete, runnable test cases in **${language}** that verify the physics is implemented correctly.

---

## Detected physics functions

${mappingsSummary}

---

## Relevant physics laws and test templates

${lawDetails || serializeKnowledgeBase()}

---

## Test types to generate

For each mapped function, generate tests of these kinds (where applicable):

1. **analytical_benchmark** — call the function with known inputs and assert the output matches the closed-form analytical result to within a tight tolerance (e.g. ±0.001 relative error).

2. **conservation_check** — run the simulation for multiple steps and verify the conserved quantity (energy, momentum, mass) doesn't drift beyond a tolerance.

3. **unit_consistency** — call the function with the same physical inputs expressed in different units and assert the results are identical.

4. **validity_range** — call with inputs at the boundary or outside the model's validity range and assert the function either raises an error or returns a documented warning.

5. **sign_convention** — test cases designed to catch sign errors: a falling object should have negative y-displacement (if downward is negative), opposing forces should reduce acceleration, etc.

6. **symmetry** — symmetric inputs should produce symmetric outputs (e.g. complementary launch angles produce equal range).

---

## Output format

Return a JSON array. Each element:
\`\`\`json
{
  "templateId": "unique-kebab-case-id",
  "lawId": "law-id-from-knowledge-base",
  "kind": "analytical_benchmark | conservation_check | unit_consistency | validity_range | sign_convention | symmetry",
  "description": "one-sentence description of what this test checks",
  "code": "complete runnable test function in ${language}",
  "language": "${language}"
}
\`\`\`

## Code requirements

- Each test is a self-contained function that can be run independently.
- Use only the standard library and the functions from the codebase (do not add external test framework dependencies unless they are standard for ${language}).
- Include the expected value and tolerance in a comment.
- Name the test function clearly: \`test_<function>_<what_is_checked>\`.
- For analytical benchmarks, include the derivation in a comment so a reviewer can verify it by hand.
- Do NOT test for internal implementation details. Test observable physical behaviour.

Return ONLY a JSON object with a "tests" key containing the array. No explanation, no markdown fences.

Example: {"tests": [...]}`
}
