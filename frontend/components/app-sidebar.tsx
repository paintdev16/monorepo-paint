"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, House, LayoutDashboard, LogOut } from "lucide-react";
import { useLogout } from "@/app/ui/session-actions";
import { Alert } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import type { SessionUser } from "@/lib/session";

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const { isMobile, state, setOpenMobile } = useSidebar();
  const isCollapsed = !isMobile && state === "collapsed";
  const { logout, busy, error } = useLogout();
  const name = user.name || user.email.split("@")[0];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu><SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label="Menú del espacio Paint" />}>
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-lg text-sidebar-primary-foreground" aria-hidden="true">✳</span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold">Paint</span><span className="truncate text-xs text-muted-foreground">Espacio personal</span></span>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56 rounded-lg" side={isCollapsed ? "right" : "bottom"} align="start" sideOffset={4}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Espacio</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href="/dashboard" />} onClick={() => setOpenMobile(false)}>
                  <span className="flex size-7 items-center justify-center rounded-md border bg-sidebar-primary text-sidebar-primary-foreground" aria-hidden="true">✳</span>
                  <span>Paint · Personal</span><Check className="ml-auto" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/" />} onClick={() => setOpenMobile(false)}><House /><span>Ir al inicio</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem></SidebarMenu>
      </SidebarHeader>

      <SidebarContent><SidebarGroup>
        <SidebarGroupLabel>Tu espacio</SidebarGroupLabel>
        <SidebarGroupContent><SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton render={<Link href="/dashboard" />} isActive={pathname === "/dashboard"} tooltip="Panel" onClick={() => setOpenMobile(false)}><LayoutDashboard /><span>Panel</span></SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton render={<Link href="/" />} tooltip="Inicio" onClick={() => setOpenMobile(false)}><House /><span>Inicio</span></SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu></SidebarGroupContent>
      </SidebarGroup></SidebarContent>

      <SidebarFooter>
        <SidebarMenu><SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label="Menú de cuenta" />}>
              <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold">{name}</span><span className="truncate text-xs text-muted-foreground">{user.email}</span></span>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56 rounded-lg" side={isCollapsed ? "right" : "top"} align={isCollapsed ? "end" : "start"} sideOffset={4}>
              <DropdownMenuGroup><DropdownMenuLabel className="font-normal"><div className="flex items-center gap-2 px-1 py-1"><Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">{name.charAt(0).toUpperCase()}</AvatarFallback></Avatar><span className="grid min-w-0 text-sm leading-tight"><span className="truncate font-semibold text-foreground">{name}</span><span className="truncate text-xs text-muted-foreground">{user.email}</span></span></div></DropdownMenuLabel></DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup><DropdownMenuItem variant="destructive" className="data-[variant=destructive]:text-foreground data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:focus:text-destructive" disabled={busy} onClick={() => void logout()}><LogOut /><span>{busy ? "Cerrando sesión…" : "Cerrar sesión"}</span></DropdownMenuItem></DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem></SidebarMenu>
        {error && <Alert variant="destructive" className="text-xs">No pudimos cerrar la sesión. Inténtalo de nuevo.</Alert>}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
