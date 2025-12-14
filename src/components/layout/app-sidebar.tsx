import { getCachedUser } from "@/components/auth/user-info";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { SidebarNav } from "./sidebar-nav";

async function SidebarUser() {
  const user = await getCachedUser();

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-full">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:mx-auto">
        {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || "U"}
      </div>
      <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-medium truncate">
          {user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.emailAddresses[0]?.emailAddress || "User"}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          {user.emailAddresses[0]?.emailAddress}
        </span>
      </div>
    </div>
  );
}

function SidebarUserSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex flex-col gap-1 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export async function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:w-full">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:mx-auto">
            T
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate">Travel Tech</span>
            <span className="text-xs text-muted-foreground truncate">
              Platform
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Suspense fallback={<SidebarUserSkeleton />}>
          <SidebarUser />
        </Suspense>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
