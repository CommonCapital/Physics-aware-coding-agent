import { notFound } from "next/navigation"

import { ReviewResults } from "@/components/review-results"
import { getReviewJob } from "@/lib/physics-lab/queries"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params
  const job = await getReviewJob(id)

  if (!job) {
    notFound()
  }

  return (
    <div className="flex min-h-svh flex-col gap-0">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <ReviewResults job={job} />
      </div>
    </div>
  )
}

// Auto-revalidate every 5 seconds while the job is running
export const revalidate = 5
