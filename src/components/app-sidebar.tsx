"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, APP } from "@/lib/config/app";
import { Badge } from "@/components/ui/badge";
import { useLastSearch } from "@/lib/search-store";

export function AppSidebar() {
  const pathname = usePathname();
  const lastProductSearch = useLastSearch();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
          <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold mx-auto">
              EI
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">{APP.name}</span>
              <span className="text-muted-foreground truncate text-xs">Research dashboard</span>
            </div>
          </div>
          {/* Tombol buka-tutup sidebar berada di dalam sidebar */}
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
        {/* Trigger saat mode icon kecil */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center w-full pt-1">
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                // Pertahankan query pencarian terakhir saat navigasi (Item 8)
                const targetHref =
                  item.href === "/products" && lastProductSearch
                    ? `/products${lastProductSearch}`
                    : item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={targetHref} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                      {item.status === "later" && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-[10px] group-data-[collapsible=icon]:hidden"
                        >
                          Later
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="text-muted-foreground px-2 py-1 text-xs group-data-[collapsible=icon]:hidden">
          {APP.timezone}
        </div>
      </SidebarFooter>

      {/* Rail toggle di batas tepi sidebar */}
      <SidebarRail />
    </Sidebar>
  );
}
