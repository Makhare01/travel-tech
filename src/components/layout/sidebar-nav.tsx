"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOrganization } from "@clerk/nextjs";
import {
  CalendarIcon,
  DashboardSquare02Icon,
  FileIcon,
  InvoiceIcon,
  Settings01Icon,
  StarIcon,
  TagIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const baseNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: DashboardSquare02Icon,
  },
  {
    title: "Booking",
    url: "/booking",
    icon: CalendarIcon,
  },
  {
    title: "Offers",
    url: "/offers",
    icon: TagIcon,
  },
  {
    title: "Contracts",
    url: "/contracts",
    icon: FileIcon,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: InvoiceIcon,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings01Icon,
  },
];

const amenitiesNavItem = {
  title: "Amenities",
  url: "/amenities",
  icon: StarIcon,
};

export function SidebarNav() {
  const pathname = usePathname();
  const { organization, isLoaded } = useOrganization();

  const navItems = useMemo(() => {
    const items = [...baseNavItems];

    // Add Amenities item if organization type is "hotel"
    if (isLoaded && organization?.publicMetadata?.type === "hotel") {
      // Insert Amenities after Offers
      const offersIndex = items.findIndex((item) => item.url === "/offers");
      items.splice(offersIndex + 1, 0, amenitiesNavItem);
    }

    return items;
  }, [organization?.publicMetadata?.type, isLoaded]);

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        // Check if the current pathname matches the item URL
        // For exact matches or when the pathname starts with the item URL (for nested routes)
        const isActive =
          pathname === item.url ||
          (item.url !== "/dashboard" && pathname.startsWith(item.url));

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
              <Link href={item.url}>
                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
