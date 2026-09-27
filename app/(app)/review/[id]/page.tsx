import { notFound } from "next/navigation"

import { AutoRefresh } from "@/components/auto-refresh"
import { ReviewResults } from "@/components/review-results"
import { getReviewJob } from "@/lib/physics-lab/queries"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function ReviewPage({ params }: Props) {
  const { id } = await params
  const job = await getReviewJob(id)

  if (!job) {
    notFound()
  }

  const inProgress = job.status === "pending" || job.status === "running"

  return (
    <div className="flex min-h-svh flex-col gap-0">
      <AutoRefresh active={inProgress} />
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <ReviewResults job={job} />
      </div>
    </div>
  )
}