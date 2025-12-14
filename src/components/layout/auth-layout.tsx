import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export async function AuthLayout({ children }: AuthLayoutProps) {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  return (
    <SidebarProvider>
      {isAuthenticated && <AppSidebar />}
      <SidebarInset>
        {isAuthenticated && <AppHeader />}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
