"use client"

import { useState, useTransition } from "react"
import { UploadIcon, CodeIcon, FlaskConicalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createReviewJob } from "@/lib/physics-lab/review-actions"

const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C / C++" },
  { value: "javascript", label: "JavaScript / TypeScript" },
  { value: "rust", label: "Rust" },
  { value: "matlab", label: "MATLAB / Octave" },
  { value: "fortran", label: "Fortran" },
  { value: "julia", label: "Julia" },
  { value: "unknown", label: "Other / auto-detect" },
]

const EXAMPLE_SCENARIOS = [
  { label: "Spring-mass RK4 integrator", lang: "python" },
  { label: "Projectile trajectory with drag", lang: "cpp" },
  { label: "RC circuit transient solver", lang: "javascript" },
  { label: "Bernoulli pipe-flow calculator", lang: "python" },
  { label: "Relativistic particle tracker", lang: "rust" },
]

export function ReviewComposer() {
  const [files, setFiles] = useState<Array<{ path: string; content: string }>>([])
  const [diff, setDiff] = useState("")
  const [language, setLanguage] = useState("python")
  const [isPending, startTransition] = useTransition()
  const [dragOver, setDragOver] = useState(false)

  async function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  async function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      /\.(py|js|ts|cpp|c|h|rs|m|f90|f|jl|txt|java|go|rb|cs)$/i.test(f.name)
    )
    const loaded = await Promise.all(
      dropped.map(async (f) => ({
        path: f.name,
        content: await readFileAsText(f),
      }))
    )
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.path))
      return [...prev, ...loaded.filter((f) => !existing.has(f.path))]
    })
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const loaded = await Promise.all(
      selected.map(async (f) => ({
        path: f.name,
        content: await readFileAsText(f),
      }))
    )
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.path))
      return [...prev, ...loaded.filter((f) => !existing.has(f.path))]
    })
    e.target.value = ""
  }

  function removeFile(path: string) {
    setFiles((prev) => prev.filter((f) => f.path !== path))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (files.length === 0 && !diff.trim()) return

    startTransition(async () => {
      await createReviewJob({
        title: files[0]?.path ?? "Physics Review",
        language,
        files,
        diff: diff.trim() || undefined,
      })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Language selector */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* File drop zone */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Source files</label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`flex min-h-32 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <UploadIcon className="size-6 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Drop source files here, or{" "}
              <label className="cursor-pointer text-primary underline-offset-2 hover:underline">
                browse
                <input
                  type="file"
                  multiple
                  accept=".py,.js,.ts,.cpp,.c,.h,.rs,.m,.f90,.f,.jl,.txt,.java,.go,.rb,.cs"
                  className="sr-only"
                  onChange={handleFileInput}
                  disabled={isPending}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              .py · .cpp · .js · .ts · .rs · .m · .f90 · .jl · and more
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col gap-1">
            {files.map((f) => (
              <li
                key={f.path}
                className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
              >
                <span className="flex items-center gap-2">
                  <CodeIcon className="size-3.5 text-muted-foreground" />
                  {f.path}
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(f.content.length / 1024 * 10) / 10} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(f.path)}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={isPending}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Optional git diff */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          Git diff{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional — for PR review)</span>
        </label>
        <textarea
          value={diff}
          onChange={(e) => setDiff(e.target.value)}
          disabled={isPending}
          placeholder="Paste output of `git diff main...HEAD` here"
          rows={4}
          className="rounded-md border border-input bg-background px-3 py-2 font-mono text-xs resize-y"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending || (files.length === 0 && !diff.trim())}
        className="self-start"
      >
        <FlaskConicalIcon className="size-4" />
        {isPending ? "Analysing…" : "Run physics review"}
      </Button>

      {/* Example scenarios */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Examples of what this catches:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_SCENARIOS.map((s) => (
            <span
              key={s.label}
              className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </form>
  )
}
