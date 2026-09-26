import React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { listSimulations, listReviewJobs } from "@/lib/physics-lab/queries"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [simulations, reviewJobsList] = await Promise.all([
    listSimulations(),
    listReviewJobs(),
  ])

  return (
    <SidebarProvider>
      <AppSidebar simulations={simulations} reviewJobs={reviewJobsList} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
