import { auth } from "@clerk/nextjs/server"
import Image from "next/image"

import { NewGameComposer } from "@/components/new-game-composer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page() {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <Empty className="flex-none">
        <EmptyHeader>
          <EmptyMedia>
            <Image src="/logo.svg" alt="Logo" width={48} height={48} />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">
            What should we simulate today?
          </EmptyTitle>
          <EmptyDescription>
            Describe a physical scenario in your own words — the geometry, the
            loads, the units — and get a running simulation with its assumptions
            and limits stated alongside the numbers.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="max-w-2xl gap-6">
          <NewGameComposer />
        </EmptyContent>
      </Empty>
    </div>
  )
}
