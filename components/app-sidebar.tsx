"use client"

import { ShieldCheckIcon, MessageSquareIcon, SquarePenIcon, FlaskConicalIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SimulationMenu } from "@/components/simulation-menu"
import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { Simulation, ReviewJob } from "@/lib/db/schema"

export function AppSidebar({
  simulations,
  reviewJobs,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  simulations: Simulation[]
  reviewJobs: ReviewJob[]
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <Link
          href="/"
          className="flex items-center gap-2 group-data-[collapsible=icon]:hidden"
        >
          <ShieldCheckIcon className="size-5 text-primary" />
          <span className="font-logo text-base">PhysicsReview</span>
        </Link>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        {/* New review action */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/"}
                render={<Link href="/" />}
              >
                <SquarePenIcon />
                <span>New review</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Recent review jobs */}
        <SidebarGroup>
          <SidebarGroupLabel>Recent reviews</SidebarGroupLabel>
          <SidebarGroupContent>
            {reviewJobs.length === 0 ? (
              <Empty className="border p-2 group-data-[collapsible=icon]:hidden">
                <EmptyDescription className="text-xs">
                  Your reviews will live here.
                </EmptyDescription>
              </Empty>
            ) : (
              <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {reviewJobs.map((job) => (
                  <SidebarMenuItem key={job.id}>
                    <SidebarMenuButton
                      isActive={pathname === `/review/${job.id}`}
                      render={<Link href={`/review/${job.id}`} />}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`size-1.5 rounded-full shrink-0 ${
                            job.status === "done"
                              ? job.criticalCount > 0
                                ? "bg-destructive"
                                : "bg-green-500"
                              : job.status === "running"
                                ? "bg-blue-500 animate-pulse"
                                : job.status === "failed"
                                  ? "bg-destructive"
                                  : "bg-muted-foreground"
                          }`}
                        />
                        {job.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger
                    render={
                      <SidebarMenuButton>
                        <MessageSquareIcon />
                        <span>Recents</span>
                      </SidebarMenuButton>
                    }
                  />
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-56 gap-1.5 p-1.5"
                  >
                    <PopoverHeader className="px-2 pt-1">
                      <PopoverTitle className="text-xs text-muted-foreground">
                        Recent reviews
                      </PopoverTitle>
                    </PopoverHeader>
                    {reviewJobs.length === 0 ? (
                      <Empty className="border p-2">
                        <EmptyDescription className="text-xs">
                          Your reviews will live here.
                        </EmptyDescription>
                      </Empty>
                    ) : (
                      <SidebarMenu>
                        {reviewJobs.map((job) => (
                          <SidebarMenuItem key={job.id}>
                            <PopoverClose
                              nativeButton={false}
                              render={
                                <SidebarMenuButton
                                  isActive={pathname === `/review/${job.id}`}
                                  render={
                                    <Link href={`/review/${job.id}`} />
                                  }
                                >
                                  <span>{job.title}</span>
                                </SidebarMenuButton>
                              }
                            />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    )}
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Physics Lab (simulation builder) — still accessible */}
        {simulations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Simulations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {simulations.slice(0, 5).map((simulation) => (
                  <SidebarMenuItem key={simulation.id}>
                    <SidebarMenuButton
                      isActive={pathname === `/simulations/${simulation.id}`}
                      render={
                        <Link href={`/simulations/${simulation.id}`} />
                      }
                    >
                      <span>{simulation.title}</span>
                    </SidebarMenuButton>
                    <SimulationMenu
                      simulationId={simulation.id}
                      title={simulation.title}
                      trigger={<SidebarMenuAction showOnHover />}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <FlaskConicalIcon className="size-4 text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            PhysicsReview
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
