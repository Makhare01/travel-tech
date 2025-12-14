"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganization, useOrganizationList, useUser } from "@clerk/nextjs";
import { Building02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function OrganizationSwitcherContent() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();
  const {
    setActive,
    userMemberships,
    isLoaded: orgListLoaded,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const router = useRouter();

  if (!orgLoaded || !userLoaded || !orgListLoaded) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  const handleSwitchOrganization = async (orgId: string) => {
    try {
      await setActive({ organization: orgId });
      router.refresh();
    } catch (error) {
      console.error("Error switching organization:", error);
    }
  };

  const currentOrgName = organization?.name || "No Organization";
  const currentOrgSlug = organization?.slug || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <HugeiconsIcon icon={Building02Icon} strokeWidth={2} />
          <span className="hidden md:inline-block font-medium">
            {currentOrgName}
          </span>
          <span className="md:hidden font-medium">
            {currentOrgSlug || currentOrgName.substring(0, 2).toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMemberships?.data?.map((membership) => {
          const orgType = membership.organization.publicMetadata?.type;
          const orgTypeString =
            orgType && typeof orgType === "string" ? orgType : null;

          return (
            <DropdownMenuItem
              key={membership.organization.id}
              onClick={() =>
                handleSwitchOrganization(membership.organization.id)
              }
              className={
                organization?.id === membership.organization.id
                  ? "bg-accent"
                  : ""
              }
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {membership.organization.name}
                </span>
                {orgTypeString && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {orgTypeString}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrganizationSwitcher() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
        </div>
      }
    >
      <OrganizationSwitcherContent />
    </Suspense>
  );
}
