import { ShieldCheckIcon, FlaskConicalIcon, CodeIcon, GitPullRequestIcon } from "lucide-react"

import { ReviewComposer } from "@/components/review-composer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

const FEATURES = [
  {
    icon: FlaskConicalIcon,
    title: "Physics knowledge base",
    description:
      "14 physical laws with governing equations, SI units, validity ranges, and known implementation bugs — built from peer-reviewed models.",
  },
  {
    icon: MapIcon,
    title: "Codebase-to-law mapping",
    description:
      "Automatically identifies which functions implement which physical laws across Python, C++, JavaScript, Rust, MATLAB, Fortran, and more.",
  },
  {
    icon: CodeIcon,
    title: "Physics-aware tests",
    description:
      "Generates analytical benchmarks, conservation checks, unit-consistency tests, and validity-range guards — the tests experts write by hand.",
  },
  {
    icon: GitPullRequestIcon,
    title: "PR-level review",
    description:
      "Flags unit mix-ups, wrong constants, sign errors, and out-of-range usage in plain language with suggested fixes. Works on diffs too.",
  },
]

function MapIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  )
}

export default async function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 px-4 py-12">
      <Empty className="flex-none w-full max-w-2xl">
        <EmptyHeader>
          <EmptyMedia>
            <ShieldCheckIcon className="size-12 text-primary" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">
            Physics-aware code review
          </EmptyTitle>
          <EmptyDescription>
            Upload your simulation code — robotics, CAE, game physics, or
            scientific computing — and get a review that catches the bugs
            that don&apos;t crash but give wrong answers: unit mix-ups, sign
            errors, wrong constants, formulas outside their valid range.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-2xl gap-6">
          <ReviewComposer />
        </EmptyContent>
      </Empty>

      {/* Feature grid */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <f.icon className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{f.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
