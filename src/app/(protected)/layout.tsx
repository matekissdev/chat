import { AppSidebar } from "@/components/app-sidebar";
import { TopLeftMenu } from "@/components/top-left-menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getUserFromSession } from "@/lib/dao/users";
import { cookies } from "next/headers";
import React from "react";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await getUserFromSession();

  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar:state");
  const defaultOpen = sidebarState ? sidebarState.value === "true" : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <TopLeftMenu />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
