"use client"

import { useState } from "react"
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FlaskConicalIcon,
} from "lucide-react"

import type { ReviewJob } from "@/lib/db/schema"

// ─── Severity badge ────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "critical") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <AlertCircleIcon className="size-3" />
        Critical
      </span>
    )
  }
  if (severity === "warning") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
        <AlertTriangleIcon className="size-3" />
        Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <InfoIcon className="size-3" />
      Info
    </span>
  )
}

// ─── Confidence badge ──────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const cls =
    confidence === "high"
      ? "bg-green-500/10 text-green-700 dark:text-green-400"
      : confidence === "medium"
        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
        : "bg-muted text-muted-foreground"
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {confidence}
    </span>
  )
}

// ─── Code block ────────────────────────────────────────────────────────────

function CodeBlock({
  code,
  language,
}: {
  code: string
  language: string
}) {
  const [expanded, setExpanded] = useState(false)
  const lines = code.split("\n")
  const preview = lines.slice(0, 8).join("\n")
  const hasMore = lines.length > 8

  return (
    <div className="rounded-md border border-border bg-muted/50">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{language}</span>
        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-primary hover:underline"
          >
            {expanded ? "collapse" : `show all ${lines.length} lines`}
          </button>
        )}
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code>{expanded ? code : preview + (hasMore ? "\n…" : "")}</code>
      </pre>
    </div>
  )
}

// ─── Finding card ──────────────────────────────────────────────────────────

function FindingCard({
  finding,
  index,
}: {
  finding: NonNullable<ReviewJob["findings"]>[number]
  index: number
}) {
  const [open, setOpen] = useState(finding.severity === "critical")

  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className="shrink-0 text-xs text-muted-foreground mt-0.5">
          #{index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SeverityBadge severity={finding.severity} />
            {finding.lawName && (
              <span className="text-xs text-muted-foreground font-mono">
                {finding.lawName}
              </span>
            )}
          </div>
          <p className="text-sm leading-snug">
            {finding.message.split("\n")[0]}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground font-mono">
            {finding.file}
            {finding.lines ? `:${finding.lines}` : ""}
          </p>
        </div>
        {open ? (
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          {finding.message.includes("\n") && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {finding.message}
            </p>
          )}
          {finding.suggestedFix && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                Suggested fix
              </p>
              <CodeBlock code={finding.suggestedFix} language="fix" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
        <CheckCircleIcon className="size-3.5" />
        Complete
      </span>
    )
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
        <FlaskConicalIcon className="size-3.5 animate-spin" />
        Analysing…
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <AlertCircleIcon className="size-3.5" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      Pending
    </span>
  )
}

// ─── Tab bar ───────────────────────────────────────────────────────────────

type Tab = "findings" | "tests" | "mappings"

function TabBar({
  active,
  onChange,
  findings,
  tests,
  mappings,
}: {
  active: Tab
  onChange: (tab: Tab) => void
  findings: number
  tests: number
  mappings: number
}) {
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "findings", label: "Findings", count: findings },
    { id: "tests", label: "Generated Tests", count: tests },
    { id: "mappings", label: "Law Mappings", count: mappings },
  ]

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-b-2 border-primary text-foreground -mb-px"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.count > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function ReviewResults({ job }: { job: ReviewJob }) {
  const [activeTab, setActiveTab] = useState<Tab>("findings")

  const findings = job.findings ?? []
  const tests = job.generatedTests ?? []
  const mappings = job.lawMappings ?? []

  const critical = findings.filter((f) => f.severity === "critical")
  const warnings = findings.filter((f) => f.severity === "warning")
  const infos = findings.filter((f) => f.severity === "info")

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{job.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {job.language} · {job.sourceFiles?.length ?? 0} file
            {(job.sourceFiles?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Summary */}
      {job.summary && (
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-sm leading-relaxed">{job.summary}</p>
        </div>
      )}

      {/* Counts */}
      {job.status === "done" && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-destructive">{critical.length}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </div>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {warnings.length}
            </p>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-2xl font-bold">{tests.length}</p>
            <p className="text-xs text-muted-foreground">Tests generated</p>
          </div>
        </div>
      )}

      {/* Pending / running state */}
      {(job.status === "pending" || job.status === "running") && (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-muted/30 px-6 py-12 text-center">
          <FlaskConicalIcon className="size-8 text-muted-foreground animate-pulse" />
          <div>
            <p className="font-medium">
              {job.status === "running" ? "Analysing your code…" : "Queued for analysis"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Running law mapping, test generation, and physics review.
              <br />
              This usually takes 30–90 seconds. Refresh when done.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {job.status === "done" && (
        <>
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            findings={findings.length}
            tests={tests.length}
            mappings={mappings.length}
          />

          {/* Findings tab */}
          {activeTab === "findings" && (
            <div className="flex flex-col gap-3">
              {findings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-green-500/5 py-10 text-center">
                  <CheckCircleIcon className="size-8 text-green-500" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    No physics issues found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The reviewer found no violations in the analysed code.
                  </p>
                </div>
              ) : (
                <>
                  {critical.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                        <AlertCircleIcon className="size-4" />
                        Critical ({critical.length})
                      </h2>
                      {critical.map((f, i) => (
                        <FindingCard key={i} finding={f} index={i} />
                      ))}
                    </section>
                  )}
                  {warnings.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                        <AlertTriangleIcon className="size-4" />
                        Warnings ({warnings.length})
                      </h2>
                      {warnings.map((f, i) => (
                        <FindingCard
                          key={i}
                          finding={f}
                          index={critical.length + i}
                        />
                      ))}
                    </section>
                  )}
                  {infos.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <InfoIcon className="size-4" />
                        Info ({infos.length})
                      </h2>
                      {infos.map((f, i) => (
                        <FindingCard
                          key={i}
                          finding={f}
                          index={critical.length + warnings.length + i}
                        />
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tests tab */}
          {activeTab === "tests" && (
            <div className="flex flex-col gap-4">
              {tests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests generated.</p>
              ) : (
                tests.map((test, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card">
                    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        {test.kind}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{test.lawId}</span>
                    </div>
                    <div className="px-4 py-3 flex flex-col gap-2">
                      <p className="text-sm">{test.description}</p>
                      <CodeBlock code={test.code} language={test.language} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mappings tab */}
          {activeTab === "mappings" && (
            <div className="flex flex-col gap-3">
              {mappings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No physics functions detected.</p>
              ) : (
                mappings.map((m, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {m.functionName}
                      </span>
                      <ConfidenceBadge confidence={m.confidence} />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {m.file}
                      {m.lines ? `:${m.lines}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.detectedLaws.map((lawId) => (
                        <span
                          key={lawId}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground"
                        >
                          {lawId}
                        </span>
                      ))}
                    </div>
                    {m.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        {m.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
